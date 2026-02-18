import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer-extra';
import type { Browser, Page } from 'puppeteer';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { user } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { CourseRepository } from '../../courses/repositories/course.repository';
import { InstituteRepository } from '../../institutes/repositories/institute.repository';
import { SubjectRepository } from '../../subjects/repositories/subject.repository';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { UserSubjectRepository } from '../repositories/user-subject.repository';

const UNICAMP_UNIVERSITY_ID = 3;
const UNICAMP_LOGIN_URL = 'https://sistemas.dac.unicamp.br/siga/mobile/';

const WEEK_DAYS: Record<number, string> = {
  2: 'seg',
  3: 'ter',
  4: 'qua',
  5: 'qui',
  6: 'sex',
  7: 'sab',
};

const INSTITUTE_MAPPER: Record<string, string> = {
  '1': 'IMECC',
  '2': 'IMECC',
  '4': 'IFGW',
  '5': 'IQ',
  '6': 'IB',
  '7': 'IEL',
  '8': 'FEAGRI',
  '9': 'FEQ',
  '10': 'FEM',
  '11': 'FEEC',
  '12': 'FECFAU',
  '13': 'FEA',
  '14': 'FOP',
  '15': 'FCM',
  '16': 'IFCH',
  '17': 'IE',
  '18': 'IEL',
  '19': 'IFCH',
  '20': 'FE',
  '21': 'FENF',
  '22': 'IA',
  '23': 'IA',
  '25': 'IA',
  '26': 'IA',
  '27': 'FEF',
  '28': 'IMECC',
  '29': 'IMECC',
  '30': 'IFCH',
  '34': 'IC/FEEC',
  '36': 'FT',
  '38': 'FE',
  '39': 'FEQ',
  '40': 'IFGW',
  '41': 'FEEC',
  '42': 'IC',
  '43': 'FEA',
  '44': 'IFCH',
  '45': 'FEF',
  '46': 'IB',
  '47': 'IE',
  '48': 'FECFAU',
  '49': 'FEM',
  '50': 'IQ',
  '51': 'IMECC/IFGW',
  '53': 'IG',
  '54': 'IG',
  '55': 'IG',
  '56': 'IQ/IFGW',
  '58': 'FCM',
  '63': 'FCF',
  '64': 'IA',
  '87': 'FT',
  '88': 'FT',
  '89': 'FT',
  '94': 'FT',
  '100': 'FCA',
  '101': 'FCA',
  '102': 'FCA',
  '107': 'FCA',
  '108': 'IFGW',
  '111': 'FT',
};

@Injectable()
export class AccessUnicampEdacService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly courseRepository: CourseRepository,
    private readonly instituteRepository: InstituteRepository,
    private readonly subjectRepository: SubjectRepository,
    private readonly subjectClassRepository: SubjectClassRepository,
    private readonly userSubjectRepository: UserSubjectRepository,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(AccessUnicampEdacService.name);
  }

  async execute(ra: string, password: string): Promise<user> {
    let browser: Browser | undefined;

    try {
      browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: true,
      });

      const page: Page = await browser.newPage();
      await page.goto(UNICAMP_LOGIN_URL, { waitUntil: 'networkidle2' });

      await page.type('#username', ra);
      await page.type('#password', password);

      await Promise.all([
        page.click('#signin-confirmar'),
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
      ]);

      let gradeJson: any = null;
      let dadosBasicosJson: any = null;

      page.on('response', async (response) => {
        const url = response.url();

        if (url.includes('dados-basicos')) {
          try {
            dadosBasicosJson = await response.json();
          } catch {}
        }

        if (url.includes('grade-horaria')) {
          try {
            gradeJson = await response.json();
          } catch {}
        }
      });

      await page.goto(
        `${UNICAMP_LOGIN_URL}app/aluno/dados-pessoais/dados-basicos`,
        { waitUntil: 'networkidle2' },
      );

      await page.goto(`${UNICAMP_LOGIN_URL}app/meu-curso/grade-horaria`, {
        waitUntil: 'networkidle2',
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      await page.goto(`${UNICAMP_LOGIN_URL}app/meu-curso/dados-curso`, {
        waitUntil: 'networkidle2',
      });

      const coursePageData = await page.evaluate(() => {
        const getValueByLabel = (label: string) => {
          const spans = Array.from(document.querySelectorAll('span'));
          const target = spans.find((el) => el.textContent?.includes(label));

          if (!target) return null;

          const container = target.closest('div');
          const value = container?.querySelector('h6');

          return value?.textContent?.trim() ?? null;
        };

        return {
          emailInstitucional: getValueByLabel('E-mail Institucional:'),
          cursoRaw: getValueByLabel('Curso:'),
        };
      });

      const name =
        dadosBasicosJson?.retorno?.DadosBasicos?.Nome?.trim() ??
        'Aluno Unicamp';

      const email = coursePageData.emailInstitucional ?? `${ra}@dac.unicamp.br`;

      let instituteName = 'Unicamp';
      let courseName = 'Curso Unicamp';

      if (coursePageData.cursoRaw) {
        const match = coursePageData.cursoRaw.match(/^(\d+)\s*-\s*(.*)$/);

        if (match) {
          const courseCode = match[1];
          courseName = match[2].trim();
          instituteName = INSTITUTE_MAPPER[courseCode] ?? 'Unicamp';
        }
      }

      const institute = await this.instituteRepository.findOrCreate(
        instituteName,
        UNICAMP_UNIVERSITY_ID,
      );

      const course = await this.courseRepository.findOrCreate(
        courseName,
        UNICAMP_UNIVERSITY_ID,
      );

      const disciplinas = gradeJson?.retorno ?? [];

      const currentYear = new Date().getFullYear();
      const currentSemester = 1 + Math.floor(new Date().getMonth() / 6);

      const subjectClassesIds: number[] = [];

      for (const disc of disciplinas) {
        const code = disc.codigoDisciplina?.trim();
        const subjectName = disc.nomeDisciplina?.trim();
        if (!code) continue;

        let subject = await this.subjectRepository.findByCode(code);
        if (!subject) {
          subject = await this.subjectRepository.create(
            code,
            subjectName,
            UNICAMP_UNIVERSITY_ID,
          );
        }

        const horarios = disc.horarios ?? [];
        const grouped: Record<string, number[]> = {};

        for (const h of horarios) {
          const dayName = WEEK_DAYS[h.dia];
          if (!dayName) continue;

          const room = h.sala?.trim() ?? '';
          const key = `${dayName}|${room}`;

          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(h.hora);
        }

        function mergeConsecutive(hours: number[]) {
          const sorted = [...hours].sort((a, b) => a - b);
          const ranges: { start: number; end: number }[] = [];

          let start = sorted[0];
          let prev = sorted[0];

          for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] === prev + 1) {
              prev = sorted[i];
            } else {
              ranges.push({ start, end: prev + 1 });
              start = sorted[i];
              prev = sorted[i];
            }
          }

          ranges.push({ start, end: prev + 1 });
          return ranges;
        }

        const availableDays: { day: string; start: number; end: number }[] = [];
        const observationLines: string[] = [];

        for (const key of Object.keys(grouped)) {
          const [dayName, room] = key.split('|');
          const ranges = mergeConsecutive(grouped[key]);

          for (const range of ranges) {
            availableDays.push({
              day: dayName,
              start: range.start,
              end: range.end,
            });

            observationLines.push(`${dayName.toUpperCase()} (${room})`);
          }
        }

        const observations = observationLines.join(' ');

        let subjectClass =
          await this.subjectClassRepository.findBySubjectAndSchedule(
            subject.id,
            availableDays,
            currentYear,
            currentSemester,
            UNICAMP_UNIVERSITY_ID,
          );

        if (!subjectClass) {
          subjectClass = await this.subjectClassRepository.create(
            subject.id,
            availableDays,
            currentYear,
            currentSemester,
            UNICAMP_UNIVERSITY_ID,
            observations,
          );
        }

        subjectClassesIds.push(subjectClass.id);
      }

      let user = await this.userRepository.findByEmail(email);

      if (!user) {
        user = await this.userRepository.create(
          email,
          name,
          course.id,
          institute.id,
          UNICAMP_UNIVERSITY_ID,
        );
      } else if (user.name !== name) {
        user = await this.userRepository.updateName(user.id, name);
      }

      for (const subjectClassId of subjectClassesIds) {
        const exists =
          await this.userSubjectRepository.findByUserAndSubjectClass(
            user.id,
            subjectClassId,
          );

        if (!exists) {
          await this.userSubjectRepository.create(user.id, subjectClassId);
        }
      }

      await browser.close();
      return user;
    } catch (error) {
      if (browser) await browser.close();

      this.logger.error({
        message: 'Error in Unicamp scraping',
        ra,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }
}
