import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer-extra';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import type { Browser, Page } from 'puppeteer';
import { user } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { CourseRepository } from '../../courses/repositories/course.repository';
import { InstituteRepository } from '../../institutes/repositories/institute.repository';
import { SubjectRepository } from '../../subjects/repositories/subject.repository';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { UserSubjectRepository } from '../repositories/user-subject.repository';

const weekDays = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
const loginJupiterLink = `https://uspdigital.usp.br/jupiterweb/webLogin.jsp`;
const userInfoJupiterLink = `https://uspdigital.usp.br/jupiterweb/uspDadosPessoaisMostrar?codmnu=4543`;
const USP_UNIVERSITY_ID = 1;

@Injectable()
export class ScrapJupiterService {
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
    this.logger.setContext(ScrapJupiterService.name);
  }

  async execute(nUsp: string, password: string, retry = 0): Promise<user> {
    let browser: Browser | undefined;

    try {
      if (retry === 10) {
        throw new Error('Max retries reached');
      }

      browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: true,
      });
      const page: Page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
      );

      this.logger.log({
        message: 'Accessing JupiterWeb login page',
        nUsp,
        retry,
      });
      await page.goto(loginJupiterLink, { timeout: 15000 });

      await page.waitForSelector("input[name='codpes']");
      await page.focus('input[name="codpes"]');
      await page.keyboard.type(nUsp);

      await page.focus('input[name="senusu"]');
      await page.keyboard.type(password);
      await page.keyboard.press('Enter');

      this.logger.log({
        message: 'Login submitted, waiting for navigation',
        nUsp,
      });

      await page.waitForNavigation({
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      const currentUrl = page.url();
      this.logger.log({
        message: 'Login navigation completed',
        nUsp,
        currentUrl,
      });

      // Check for error message on page
      const hasErrorMessage = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        return bodyText.includes('Usuário / Senha Incorreta!');
      });

      if (hasErrorMessage) {
        this.logger.error({
          message: 'Login failed: Invalid credentials',
          nUsp,
          hasErrorMessage,
        });
        throw new Error('Invalid credentials');
      }

      this.logger.log({
        message: 'Login successful, accessing class schedule',
        nUsp,
      });

      await page.goto(
        'https://uspdigital.usp.br/jupiterweb/gradeHoraria?codmnu=4759',
        {
          waitUntil: 'domcontentloaded',
          timeout: 10000,
        },
      );

      await page.waitForSelector('select');
      await page.waitForSelector('option:nth-child(2)');

      const options = await page.evaluate(() =>
        Array.from(document.querySelectorAll('option')).map(
          (element) => (element as HTMLOptionElement).value,
        ),
      );

      options.sort();
      await page.select(`select`, options[options.length - 1]);

      await page.waitForSelector('input[type="button"][value="Buscar"]', {
        timeout: 5000,
      });
      await page.click('input[type="button"][value="Buscar"]');
      await page.waitForSelector("tr[id='1']");

      this.logger.log({
        message: 'Extracting course and institute information',
        nUsp,
      });
      await page.waitForSelector('#curso', { timeout: 5000 });
      await page.waitForSelector('#unidade', { timeout: 5000 });
      const courseElement = await page.$('#curso');
      const brokeCourseText = (
        await page.evaluate((el) => el?.textContent, courseElement)
      )?.split(' - ');

      const instituteElement = await page.$('#unidade');
      const jupiterWebInstitute = (
        await page.evaluate((el) => el?.textContent, instituteElement)
      )?.split(' - ')[1];

      let jupiterWebCourse = '';
      for (const text of brokeCourseText!) {
        if (isNaN(text as any)) {
          jupiterWebCourse = text;
          break;
        }
      }

      const institute = await this.instituteRepository.findOrCreate(
        jupiterWebInstitute!,
        USP_UNIVERSITY_ID,
      );
      const course = await this.courseRepository.findOrCreate(
        jupiterWebCourse,
        USP_UNIVERSITY_ID,
      );

      this.logger.log({
        message: 'Extracting subjects from class schedule',
        nUsp,
        course: jupiterWebCourse,
        institute: jupiterWebInstitute,
      });

      let rowIndex = 1;
      const hash: Record<
        string,
        {
          days: Array<{ day: string; start: string; end: string }>;
          observations: string;
        }
      > = {};

      // First pass: collect all subjects and their schedules
      while (await page.$(`tr[id='${rowIndex}']`)) {
        let element = await page.$(`tr[id='${rowIndex}'] > td:nth-child(1)`);
        const startHour = await page.evaluate((el) => el?.textContent, element);

        element = await page.$(`tr[id='${rowIndex}'] > td:nth-child(2)`);
        const lastHour = await page.evaluate((el) => el?.textContent, element);

        for (let tdIndex = 3; tdIndex <= 8; tdIndex++) {
          element = await page.$(
            `tr[id='${rowIndex}'] > td:nth-child(${tdIndex})`,
          );
          let subject = await page.evaluate((el) => el?.textContent, element);

          if (subject) {
            subject = subject.split('-')[0].trim();

            if (!hash[subject]) {
              hash[subject] = {
                days: [
                  {
                    day: weekDays[tdIndex - 3],
                    start: startHour!,
                    end: lastHour!,
                  },
                ],
                observations: '',
              };
            } else {
              hash[subject].days.push({
                day: weekDays[tdIndex - 3],
                start: startHour!,
                end: lastHour!,
              });
            }
          }
        }

        rowIndex++;
      }

      this.logger.log({
        message: 'Collected subjects from schedule',
        nUsp,
        totalSubjects: Object.keys(hash).length,
      });

      // Second pass: get observations for each unique subject
      let firstTime = true;
      for (const subjectCode of Object.keys(hash)) {
        try {
          await page.waitForSelector(`span[class*="${subjectCode}"]`, {
            timeout: 3000,
          });

          const spanElement = await page.$(`span[class*="${subjectCode}"]`);
          await spanElement?.click();
          await page.waitForSelector('.blockOverlay', { hidden: true });

          if (firstTime) {
            await spanElement?.click();
            await page.waitForSelector('.blockOverlay', { hidden: true });
            firstTime = false;
          }

          await page.waitForSelector('a[href="#div_oferecimento"]', {
            timeout: 5000,
          });
          await page.click('a[href="#div_oferecimento"]');
          await page.waitForSelector('.blockOverlay', { hidden: true });

          await page.waitForSelector(
            'div[class="adicionado"] > table > tbody > tr > td[class="obstur"]',
            { timeout: 5000 },
          );
          const observationsElement = await page.$(
            'div[class="adicionado"] > table > tbody > tr > td[class="obstur"]',
          );
          const observationsText = await page.evaluate(
            (el) => el?.textContent?.replace(/\n/g, ' '),
            observationsElement,
          );

          hash[subjectCode].observations = observationsText || '';
        } catch (error) {
          this.logger.warn({
            message: 'Failed to extract observations for subject',
            subject: subjectCode,
            nUsp,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      this.logger.log({
        message: 'Processing found subjects',
        nUsp,
        totalSubjects: Object.keys(hash).length,
        subjects: hash,
      });
      const newSubjectsInfo: Array<{
        subjectCode: string;
        subjectName: string;
      }> = [];
      const subjectsAlreadyRegistered =
        await this.subjectRepository.findManyByCodes(Object.keys(hash));

      const notRegisteredSubjectCodes = Object.keys(hash).filter(
        (subjectCode) =>
          !subjectsAlreadyRegistered.find(
            (subject) => subject.code === subjectCode,
          ),
      );

      for (const subjectCode of notRegisteredSubjectCodes) {
        try {
          await page.waitForSelector(`span[class*="${subjectCode}"]`, {
            timeout: 5000,
          });
          await page.$eval(`span[class*="${subjectCode}"]`, (element) =>
            (element as HTMLElement).click(),
          );
          await page.waitForSelector(
            `xpath///*[@class="coddis" and text()="${subjectCode}"]`,
            { timeout: 5000 },
          );
          await page.waitForSelector('.nomdis', { timeout: 5000 });
          const subjectName = await page.evaluate(
            () => document.querySelector('.nomdis')?.textContent,
          );
          newSubjectsInfo.push({
            subjectCode,
            subjectName: subjectName || '',
          });
        } catch (error: unknown) {
          this.logger.warn({
            message: 'Failed to extract subject info, skipping',
            subjectCode,
            nUsp,
            error: error instanceof Error ? error.message : String(error),
          });
          // Continua para próxima matéria se falhar
          continue;
        }
      }

      for (const newSubjectInfo of newSubjectsInfo) {
        const newSubject = await this.subjectRepository.create(
          newSubjectInfo.subjectCode,
          newSubjectInfo.subjectName,
          USP_UNIVERSITY_ID,
        );
        subjectsAlreadyRegistered.push(newSubject);
      }

      const subjectClasses = Object.keys(hash)
        .map((subjectCode: string) => {
          const subject = subjectsAlreadyRegistered.find(
            (subject) => subject.code === subjectCode,
          );

          if (!subject) {
            this.logger.warn({
              message: 'Subject not found in registered subjects, skipping',
              subjectCode,
              nUsp,
              registeredCodes: subjectsAlreadyRegistered.map((s) => s.code),
            });
            return null;
          }

          return {
            subjectId: subject.id,
            availableDays: hash[subjectCode].days,
            observations: hash[subjectCode].observations,
          };
        })
        .filter((subjectClass) => subjectClass !== null) as Array<{
        subjectId: number;
        availableDays: Array<{ day: string; start: string; end: string }>;
        observations: string;
      }>;

      const subjectClassesIds: number[] = [];
      const currentYear = new Date().getFullYear();
      const currentSemester = 1 + Math.floor(new Date().getMonth() / 6);

      for (const subjectClass of subjectClasses) {
        const dbSubjectClass =
          await this.subjectClassRepository.findBySubjectAndSchedule(
            subjectClass.subjectId,
            subjectClass.availableDays,
            currentYear,
            currentSemester,
            USP_UNIVERSITY_ID,
          );

        if (dbSubjectClass) {
          subjectClassesIds.push(dbSubjectClass.id);

          if (dbSubjectClass.observations !== subjectClass.observations) {
            await this.subjectClassRepository.updateObservations(
              dbSubjectClass.id,
              subjectClass.observations,
            );
          }
          continue;
        }

        const newSubjectClass = await this.subjectClassRepository.create(
          subjectClass.subjectId,
          subjectClass.availableDays,
          currentYear,
          currentSemester,
          USP_UNIVERSITY_ID,
          subjectClass.observations,
        );

        subjectClassesIds.push(newSubjectClass.id);
      }

      this.logger.log({
        message: 'Fetching user personal information',
        nUsp,
        subjectClassesCount: subjectClassesIds.length,
      });
      await page.goto(userInfoJupiterLink, { waitUntil: 'load' });

      await page.waitForSelector('font', { timeout: 5000 });
      await page.waitForSelector("td[width='77%'] font", { timeout: 5000 });

      const allFontsTexts = await page.evaluate(() =>
        Array.from(document.querySelectorAll('font')).map(
          (element) => element.textContent,
        ),
      );

      const all77WidthFontTexts = await page.evaluate(() =>
        Array.from(document.querySelectorAll("td[width='77%'] font")).map(
          (element) => element.textContent,
        ),
      );

      // Special name mappings for specific users
      const nameOverrides: Record<string, string> = {
        '13725587': 'Yuri Faria',
        '15451742': 'Felipe Skubs',
        '15582071': 'Prado',
      };

      const name =
        nameOverrides[nUsp] || all77WidthFontTexts[1] || 'Estudante USP';

      const emails = allFontsTexts.filter((text: string) =>
        text!.includes('@'),
      );
      const email =
        emails.find((email: string) => email!.includes('usp.br')) ||
        emails[0] ||
        nUsp;

      await browser.close();

      let user = await this.userRepository.findByEmail(email);

      if (user) {
        const userSubjectClasses =
          await this.userSubjectRepository.findManyByUserId(user.id);
        const userSubjectClassesIds = userSubjectClasses.map(
          (userSubjectClass) => userSubjectClass.subjectClassId,
        );
        const userSubjectClassesToRemove = userSubjectClassesIds.filter(
          (userSubjectClassId) =>
            !subjectClassesIds.includes(userSubjectClassId),
        );

        if (userSubjectClassesToRemove.length) {
          await this.userSubjectRepository.softDeleteMany(
            user.id,
            userSubjectClassesToRemove,
          );
        }

        if (name !== user.name) {
          user = await this.userRepository.updateName(user.id, name);
        }
      }

      if (!user) {
        user = await this.userRepository.create(
          email,
          name,
          course.id,
          institute.id,
          USP_UNIVERSITY_ID,
        );
      }

      for (const subjectClassId of subjectClassesIds) {
        const userSubject =
          await this.userSubjectRepository.findByUserAndSubjectClass(
            user.id,
            subjectClassId,
          );

        if (!userSubject) {
          await this.userSubjectRepository.create(user.id, subjectClassId);
        } else if (userSubject.deletedAt) {
          // Restore if it was soft deleted
          await this.userSubjectRepository.restore(user.id, subjectClassId);
          this.logger.log({
            message: 'Restored deleted user subject',
            userId: user.id,
            subjectClassId,
          });
        }
      }

      this.logger.log({
        message: 'User processed successfully',
        userId: user.id,
        email: user.email,
        nUsp,
        courseId: user.courseId,
        instituteId: user.instituteId,
        subjectClassesCount: subjectClassesIds.length,
      });

      await browser.close();
      return user;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error during scraping process',
        nUsp,
        retry,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          this.logger.error({
            message: 'Error closing browser',
            error:
              closeError instanceof Error
                ? closeError.message
                : String(closeError),
          });
        }
      }

      if (
        error instanceof Error &&
        error.message.includes('Failed to launch the browser process!')
      ) {
        this.logger.warn({
          message: 'Puppeteer memory error, retrying',
          nUsp,
          retry,
          maxRetries: 10,
        });
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return this.execute(nUsp, password, retry + 1);
      }

      throw error;
    }
  }
}
