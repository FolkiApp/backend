import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer-extra';
import type { Browser, Page, HTTPResponse } from 'puppeteer';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { user } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { CourseRepository } from '../../courses/repositories/course.repository';
import { InstituteRepository } from '../../institutes/repositories/institute.repository';
import { SubjectRepository } from '../../subjects/repositories/subject.repository';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { UserSubjectRepository } from '../repositories/user-subject.repository';

interface SigaHorario {
  dia: number;
  hora: number;
  sala?: string;
}

interface SigaDisciplina {
  codigoDisciplina: string;
  nomeDisciplina: string;
  horarios?: SigaHorario[];
  sala?: string;
}

interface SigaResponse {
  retorno: SigaDisciplina[];
}

interface SigaDadosBasicos {
  retorno: {
    DadosBasicos: {
      Nome: string;
    };
  };
}

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
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
      });

      const page: Page = await browser.newPage();
      let gradeJson: SigaResponse | null = null;
      let dadosBasicosJson: SigaDadosBasicos | null = null;

      page.on('response', (response: HTTPResponse) => {
        const url = response.url();
        if (url.includes('dados-basicos')) {
          response
            .json()
            .then((d) => {
              dadosBasicosJson = d as SigaDadosBasicos;
            })
            .catch(() => {});
        }
        if (url.includes('grade-horaria')) {
          response
            .json()
            .then((d) => {
              gradeJson = d as SigaResponse;
            })
            .catch(() => {});
        }
      });

      await page.goto(UNICAMP_LOGIN_URL, { waitUntil: 'networkidle2' });
      await page.type('#username', ra);
      await page.type('#password', password);
      await Promise.all([
        page.click('#signin-confirmar'),
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
      ]);

      await page.goto(
        `${UNICAMP_LOGIN_URL}app/aluno/dados-pessoais/dados-basicos`,
        { waitUntil: 'networkidle2' },
      );
      await page.goto(`${UNICAMP_LOGIN_URL}app/meu-curso/grade-horaria`, {
        waitUntil: 'networkidle2',
      });

      await page
        .waitForFunction(() => document.querySelectorAll('button').length > 5, {
          timeout: 10000,
        })
        .catch(() => {});
      const roomMap = await page
        .evaluate(async () => {
          const map: Record<string, string> = {};
          const buttons = Array.from(
            document.querySelectorAll('button'),
          ).filter((b) => b.innerText.includes('/'));
          for (const btn of buttons) {
            const parts = (btn as HTMLElement).innerText
              .split('/')
              .map((p) => p.trim());
            if (parts.length < 3) continue;
            const key = `${parts[0]}-${parts[2]}`;
            if (map[key]) continue;
            (btn as HTMLElement).click();
            await new Promise((r) => setTimeout(r, 450));
            const modalText =
              document.querySelector('[role="dialog"] h6')?.textContent;
            if (modalText) map[key] = modalText.trim();
            (
              document.querySelector(
                '[role="dialog"] button:last-child',
              ) as HTMLElement
            )?.click();
            await new Promise((r) => setTimeout(r, 350));
          }
          return map;
        })
        .catch(() => ({}) as Record<string, string>);

      await page.goto(`${UNICAMP_LOGIN_URL}app/meu-curso/dados-curso`, {
        waitUntil: 'networkidle2',
      });
      const coursePageData = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span'));
        const target = spans.find((s) => s.textContent?.includes('Curso:'));
        return {
          email: spans
            .find((s) => s.textContent?.includes('E-mail:'))
            ?.closest('div')
            ?.querySelector('h6')
            ?.textContent?.trim(),
          cursoRaw: target
            ?.closest('div')
            ?.querySelector('h6')
            ?.textContent?.trim(),
        };
      });

      const safeDados = dadosBasicosJson as SigaDadosBasicos | null;
      const safeGrade = gradeJson as SigaResponse | null;

      const name =
        safeDados?.retorno?.DadosBasicos?.Nome?.trim() ?? 'Aluno Unicamp';
      const email = coursePageData.email ?? `${ra}@dac.unicamp.br`;

      let instituteName = 'Unicamp';
      let courseName = 'Curso Unicamp';

      if (coursePageData.cursoRaw) {
        const match = coursePageData.cursoRaw.match(/^(\d+)\s*-\s*(.*)$/);
        if (match) {
          const courseCode = match[1];
          courseName = match[2].trim();
          instituteName = INSTITUTE_MAPPER[courseCode] ?? 'Unicamp';
        } else {
          courseName = coursePageData.cursoRaw;
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

      const disciplinas = safeGrade?.retorno ?? [];
      const currentYear = new Date().getFullYear();
      const currentSemester = 1 + Math.floor(new Date().getMonth() / 6);
      const subjectClassesIds: number[] = [];

      for (const disc of disciplinas) {
        const code = disc.codigoDisciplina.trim();
        const subject =
          (await this.subjectRepository.findByCode(code)) ||
          (await this.subjectRepository.create(
            code,
            disc.nomeDisciplina.trim(),
            UNICAMP_UNIVERSITY_ID,
          ));

        const horarios = disc.horarios ?? [];
        const availableDays: { day: string; start: number; end: number }[] = [];
        const observationLines: string[] = [];

        for (const h of horarios) {
          const dayName = WEEK_DAYS[h.dia] || 'seg';
          const shortRoom = h.sala?.trim() ?? '';
          const fullRoom = roomMap[`${code}-${shortRoom}`] || shortRoom;

          availableDays.push({ day: dayName, start: h.hora, end: h.hora + 1 });

          if (fullRoom) {
            const roomWithDay = `${dayName.toUpperCase()} (${fullRoom})`;
            if (!observationLines.includes(roomWithDay))
              observationLines.push(roomWithDay);
          }
        }

        const subjectClass = await this.subjectClassRepository.create(
          subject.id,
          availableDays,
          currentYear,
          currentSemester,
          UNICAMP_UNIVERSITY_ID,
          observationLines.join(', '),
        );
        subjectClassesIds.push(subjectClass.id);
      }

      let userEntity = await this.userRepository.findByEmail(email);
      if (!userEntity) {
        userEntity = await this.userRepository.create(
          email,
          name,
          course.id,
          institute.id,
          UNICAMP_UNIVERSITY_ID,
        );
      } else if (userEntity.name !== name) {
        userEntity = await this.userRepository.updateName(userEntity.id, name);
      }

      for (const classId of subjectClassesIds) {
        const exists =
          await this.userSubjectRepository.findByUserAndSubjectClass(
            userEntity.id,
            classId,
          );
        if (!exists)
          await this.userSubjectRepository.create(userEntity.id, classId);
      }

      await browser.close();
      return userEntity;
    } catch (error) {
      if (browser) await browser.close();
      this.logger.error({
        message: 'Scraping failed',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
