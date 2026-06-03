import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer-extra';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import type { Browser, Page } from 'puppeteer';
import { user, course, institute, Prisma } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { CourseRepository } from '../../courses/repositories/course.repository';
import { InstituteRepository } from '../../institutes/repositories/institute.repository';
import { SubjectRepository } from '../../subjects/repositories/subject.repository';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { UserSubjectRepository } from '../repositories/user-subject.repository';
import { Subject } from '../../subjects/entities/subject.entity';

const weekDays = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
const loginJupiterLink = `https://uspdigital.usp.br/jupiterweb/webLogin.jsp`;
const userInfoJupiterLink = `https://uspdigital.usp.br/jupiterweb/uspDadosPessoaisMostrar?codmnu=4543`;
const scheduleLink = `https://uspdigital.usp.br/jupiterweb/gradeHoraria?codmnu=4759`;
const USP_UNIVERSITY_ID = 1;
const MAX_RETRIES = 10;

interface ScheduleEntry {
  day: string;
  start: string;
  end: string;
}

interface SubjectScheduleHash {
  [subjectCode: string]: {
    days: ScheduleEntry[];
    observations: string;
  };
}

interface SubjectClassPayload {
  subjectId: number;
  availableDays: ScheduleEntry[];
  observations: string;
}

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
    if (retry === MAX_RETRIES) {
      throw new Error('Max retries reached');
    }

    let browser: Browser | undefined;
    try {
      const session = await this.openSession(nUsp, retry);
      browser = session.browser;
      const page = session.page;

      await this.loginAndAssertCredentials(page, nUsp, password);
      await this.openLatestSchedule(page, nUsp);

      const { course, institute } = await this.extractCourseAndInstitute(
        page,
        nUsp,
      );

      const hash = await this.collectScheduleHash(page);
      this.logger.log({
        message: 'Collected subjects from schedule',
        nUsp,
        totalSubjects: Object.keys(hash).length,
      });

      await this.enrichWithObservations(page, hash, nUsp);

      const allSubjects = await this.syncSubjects(page, hash, nUsp);
      const subjectClasses = this.buildSubjectClasses(hash, allSubjects, nUsp);
      const subjectClassesIds = await this.syncSubjectClasses(subjectClasses);

      const { name, email } = await this.extractUserPersonalInfo(page, nUsp);
      await browser.close();

      const persistedUser = await this.upsertUser(
        email,
        name,
        course.id,
        institute.id,
      );
      await this.removeStaleUserSubjects(persistedUser.id, subjectClassesIds);
      await this.attachUserSubjects(persistedUser.id, subjectClassesIds);

      this.logger.log({
        message: 'User processed successfully',
        userId: persistedUser.id,
        email: persistedUser.email,
        nUsp,
        courseId: persistedUser.courseId,
        instituteId: persistedUser.instituteId,
        subjectClassesCount: subjectClassesIds.length,
      });

      return persistedUser;
    } catch (error: unknown) {
      return this.handleScrapeError(error, browser, nUsp, password, retry);
    }
  }

  private async openSession(
    nUsp: string,
    retry: number,
  ): Promise<{ browser: Browser; page: Page }> {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox'],
      headless: true,
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH ||
        '/usr/bin/google-chrome-stable',
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

    return { browser, page };
  }

  private async loginAndAssertCredentials(
    page: Page,
    nUsp: string,
    password: string,
  ): Promise<void> {
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
  }

  private async openLatestSchedule(page: Page, nUsp: string): Promise<void> {
    this.logger.log({
      message: 'Login successful, accessing class schedule',
      nUsp,
    });

    await page.goto(scheduleLink, {
      waitUntil: 'domcontentloaded',
      timeout: 10001,
    });

    await page.waitForSelector('select');
    await page.waitForSelector('option:nth-child(2)');

    const options = await page.evaluate(() =>
      Array.from(document.querySelectorAll('option')).map(
        (element) => element.value,
      ),
    );

    options.sort();
    await page.select(`select`, options[options.length - 1]);

    await page.waitForSelector('input[type="button"][value="Buscar"]', {
      timeout: 5000,
    });
    await page.click('input[type="button"][value="Buscar"]');
    await page.waitForSelector("tr[id='1']");
  }

  private async extractCourseAndInstitute(
    page: Page,
    nUsp: string,
  ): Promise<{ course: course; institute: institute }> {
    this.logger.log({
      message: 'Extracting course and institute information',
      nUsp,
    });

    await page.waitForSelector('#curso', { timeout: 5000 });
    await page.waitForSelector('#unidade', { timeout: 5000 });

    const courseElement = await page.$('#curso');
    const brokeCourseText =
      (await page.evaluate((el) => el?.textContent, courseElement))?.split(
        ' - ',
      ) ?? [];

    const instituteElement = await page.$('#unidade');
    const jupiterWebInstitute = (
      await page.evaluate((el) => el?.textContent, instituteElement)
    )?.split(' - ')[1];

    if (!jupiterWebInstitute) {
      throw new Error('Failed to extract institute from JupiterWeb');
    }

    const jupiterWebCourse = this.pickCourseName(brokeCourseText);

    const institute = await this.instituteRepository.findOrCreate(
      jupiterWebInstitute,
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

    return { course, institute };
  }

  private pickCourseName(brokeCourseText: string[]): string {
    return brokeCourseText.find((text) => Number.isNaN(Number(text))) ?? '';
  }

  private async collectScheduleHash(page: Page): Promise<SubjectScheduleHash> {
    const hash: SubjectScheduleHash = {};
    let rowIndex = 1;

    while (await page.$(`tr[id='${rowIndex}']`)) {
      const startHour = await this.readCellText(page, rowIndex, 1);
      const lastHour = await this.readCellText(page, rowIndex, 2);

      for (let tdIndex = 3; tdIndex <= 8; tdIndex++) {
        const subjectCell = await this.readCellText(page, rowIndex, tdIndex);
        if (!subjectCell) continue;

        const subjectCode = subjectCell.split('-')[0].trim();
        this.appendScheduleEntry(hash, subjectCode, {
          day: weekDays[tdIndex - 3],
          start: startHour!,
          end: lastHour!,
        });
      }

      rowIndex++;
    }

    return hash;
  }

  private async readCellText(
    page: Page,
    rowIndex: number,
    columnIndex: number,
  ): Promise<string | null | undefined> {
    const element = await page.$(
      `tr[id='${rowIndex}'] > td:nth-child(${columnIndex})`,
    );
    return page.evaluate((el) => el?.textContent, element);
  }

  private appendScheduleEntry(
    hash: SubjectScheduleHash,
    subjectCode: string,
    entry: ScheduleEntry,
  ): void {
    if (!hash[subjectCode]) {
      hash[subjectCode] = { days: [entry], observations: '' };
      return;
    }
    hash[subjectCode].days.push(entry);
  }

  private async enrichWithObservations(
    page: Page,
    hash: SubjectScheduleHash,
    nUsp: string,
  ): Promise<void> {
    let firstTime = true;
    for (const subjectCode of Object.keys(hash)) {
      const observations = await this.fetchObservationsFor(
        page,
        subjectCode,
        firstTime,
        nUsp,
      );
      if (observations !== null) {
        hash[subjectCode].observations = observations;
      }
      firstTime = false;
    }
  }

  private async fetchObservationsFor(
    page: Page,
    subjectCode: string,
    firstTime: boolean,
    nUsp: string,
  ): Promise<string | null> {
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
      }

      await page.waitForSelector('a[href="#div_oferecimento"]', {
        timeout: 5000,
      });
      await page.click('a[href="#div_oferecimento"]');
      await page.waitForSelector('.blockOverlay', { hidden: true });

      // If there's explicitly no offering for this discipline, skip waiting
      const noOffering = await page.evaluate(() =>
        document.body.textContent?.includes(
          'Não há oferecimento para esta disciplina!',
        ),
      );
      if (noOffering) {
        this.logger.log({
          message: 'No offering for subject, skipping observations',
          subject: subjectCode,
          nUsp,
        });
        return null;
      }

      await page.waitForSelector(
        'div[class="adicionado"] > table > tbody > tr > td[class="obstur"]',
        { timeout: 3000 },
      );
      const observationsElement = await page.$(
        'div[class="adicionado"] > table > tbody > tr > td[class="obstur"]',
      );
      const observationsText = await page.evaluate(
        (el) => el?.textContent?.replaceAll('\n', ' '),
        observationsElement,
      );

      return observationsText ?? null;
    } catch (error) {
      this.logger.warn({
        message: 'Failed to extract observations for subject',
        subject: subjectCode,
        nUsp,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private async syncSubjects(
    page: Page,
    hash: SubjectScheduleHash,
    nUsp: string,
  ): Promise<Subject[]> {
    this.logger.log({
      message: 'Processing found subjects',
      nUsp,
      totalSubjects: Object.keys(hash).length,
      subjects: hash,
    });

    const codes = Object.keys(hash);
    const subjectsAlreadyRegistered =
      await this.subjectRepository.findManyByCodes(codes);
    const registeredCodes = new Set(
      subjectsAlreadyRegistered.map((s) => s.code),
    );
    const missingCodes = codes.filter((code) => !registeredCodes.has(code));

    const newSubjectsInfo = await this.collectMissingSubjectInfo(
      page,
      missingCodes,
      nUsp,
    );

    for (const newSubjectInfo of newSubjectsInfo) {
      const newSubject = await this.subjectRepository.create(
        newSubjectInfo.subjectCode,
        newSubjectInfo.subjectName,
        USP_UNIVERSITY_ID,
      );
      subjectsAlreadyRegistered.push(newSubject);
    }

    return subjectsAlreadyRegistered;
  }

  private async collectMissingSubjectInfo(
    page: Page,
    missingCodes: string[],
    nUsp: string,
  ): Promise<Array<{ subjectCode: string; subjectName: string }>> {
    const result: Array<{ subjectCode: string; subjectName: string }> = [];

    for (const subjectCode of missingCodes) {
      const subjectName = await this.fetchSubjectName(page, subjectCode, nUsp);
      if (subjectName === null) continue;
      result.push({ subjectCode, subjectName });
    }

    return result;
  }

  private async fetchSubjectName(
    page: Page,
    subjectCode: string,
    nUsp: string,
  ): Promise<string | null> {
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
      return subjectName ?? '';
    } catch (error: unknown) {
      this.logger.warn({
        message: 'Failed to extract subject info, skipping',
        subjectCode,
        nUsp,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private buildSubjectClasses(
    hash: SubjectScheduleHash,
    registeredSubjects: Subject[],
    nUsp: string,
  ): SubjectClassPayload[] {
    const byCode = new Map(registeredSubjects.map((s) => [s.code, s]));

    return Object.keys(hash)
      .map((subjectCode) => {
        const subject = byCode.get(subjectCode);
        if (!subject) {
          this.logger.warn({
            message: 'Subject not found in registered subjects, skipping',
            subjectCode,
            nUsp,
            registeredCodes: registeredSubjects.map((s) => s.code),
          });
          return null;
        }
        return {
          subjectId: subject.id,
          availableDays: hash[subjectCode].days,
          observations: hash[subjectCode].observations,
        };
      })
      .filter((sc): sc is SubjectClassPayload => sc !== null);
  }

  private async syncSubjectClasses(
    subjectClasses: SubjectClassPayload[],
  ): Promise<number[]> {
    const subjectClassesIds: number[] = [];
    const currentYear = new Date().getFullYear();
    const currentSemester = 1 + Math.floor(new Date().getMonth() / 6);

    for (const subjectClass of subjectClasses) {
      const id = await this.upsertSubjectClass(
        subjectClass,
        currentYear,
        currentSemester,
      );
      subjectClassesIds.push(id);
    }

    return subjectClassesIds;
  }

  private async upsertSubjectClass(
    subjectClass: SubjectClassPayload,
    currentYear: number,
    currentSemester: number,
  ): Promise<number> {
    const dbSubjectClass =
      await this.subjectClassRepository.findBySubjectAndSchedule(
        subjectClass.subjectId,
        subjectClass.availableDays as unknown as Prisma.InputJsonValue,
        currentYear,
        currentSemester,
        USP_UNIVERSITY_ID,
      );

    if (dbSubjectClass) {
      if (
        subjectClass.observations &&
        dbSubjectClass.observations !== subjectClass.observations
      ) {
        await this.subjectClassRepository.updateObservations(
          dbSubjectClass.id,
          subjectClass.observations,
        );
      }
      return dbSubjectClass.id;
    }

    const newSubjectClass = await this.subjectClassRepository.create(
      subjectClass.subjectId,
      subjectClass.availableDays as unknown as Prisma.InputJsonValue,
      currentYear,
      currentSemester,
      USP_UNIVERSITY_ID,
      subjectClass.observations,
    );
    return newSubjectClass.id;
  }

  private async extractUserPersonalInfo(
    page: Page,
    nUsp: string,
  ): Promise<{ name: string; email: string }> {
    this.logger.log({
      message: 'Fetching user personal information',
      nUsp,
    });
    await page.goto(userInfoJupiterLink, { waitUntil: 'load' });

    await page.waitForSelector('font', { timeout: 9000 });
    await page.waitForSelector("td[width='77%'] font", { timeout: 9000 });

    const allFontsTexts = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('font')).map(
        (element) => element.textContent,
      ),
    );

    const all77WidthFontTexts = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLElement>("td[width='77%'] font"),
      ).map((element) => element.textContent),
    );

    // Special name mappings for specific users
    const nameOverrides: Record<string, string> = {
      '13725587': 'Yuri Faria',
      '15451742': 'Felipe Skubs',
      '15582071': 'Prado',
    };

    const name =
      nameOverrides[nUsp] || all77WidthFontTexts[1] || 'Estudante USP';

    const emails = allFontsTexts.filter(
      (text): text is string => text !== null && text.includes('@'),
    );
    const email =
      emails.find((email) => email.includes('usp.br')) || emails[0] || nUsp;

    return { name, email };
  }

  private async upsertUser(
    email: string,
    name: string,
    courseId: number,
    instituteId: number,
  ): Promise<user> {
    const existing = await this.userRepository.findByEmail(email);
    if (!existing) {
      return this.userRepository.create(
        email,
        name,
        courseId,
        instituteId,
        USP_UNIVERSITY_ID,
      );
    }

    if (name !== existing.name) {
      return this.userRepository.updateName(existing.id, name);
    }

    return existing;
  }

  private async removeStaleUserSubjects(
    userId: number,
    currentSubjectClassesIds: number[],
  ): Promise<void> {
    const userSubjectClasses =
      await this.userSubjectRepository.findManyByUserId(userId);
    const currentIds = new Set(currentSubjectClassesIds);
    const toRemove = userSubjectClasses
      .map((us) => us.subjectClassId)
      .filter((id) => !currentIds.has(id));

    if (toRemove.length === 0) return;
    await this.userSubjectRepository.softDeleteMany(userId, toRemove);
  }

  private async attachUserSubjects(
    userId: number,
    subjectClassesIds: number[],
  ): Promise<void> {
    for (const subjectClassId of subjectClassesIds) {
      await this.attachSingleUserSubject(userId, subjectClassId);
    }
  }

  private async attachSingleUserSubject(
    userId: number,
    subjectClassId: number,
  ): Promise<void> {
    const userSubject =
      await this.userSubjectRepository.findByUserAndSubjectClass(
        userId,
        subjectClassId,
      );

    if (!userSubject) {
      await this.userSubjectRepository.create(userId, subjectClassId);
      return;
    }

    if (userSubject.deletedAt) {
      await this.userSubjectRepository.restore(userId, subjectClassId);
      this.logger.log({
        message: 'Restored deleted user subject',
        userId,
        subjectClassId,
      });
    }
  }

  private async handleScrapeError(
    error: unknown,
    browser: Browser | undefined,
    nUsp: string,
    password: string,
    retry: number,
  ): Promise<user> {
    this.logger.error({
      message: 'Error during scraping process',
      nUsp,
      retry,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    await this.closeBrowserSafely(browser);

    if (this.isBrowserLaunchError(error)) {
      this.logger.warn({
        message: 'Puppeteer memory error, retrying',
        nUsp,
        retry,
        maxRetries: MAX_RETRIES,
      });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return this.execute(nUsp, password, retry + 1);
    }

    throw error;
  }

  private async closeBrowserSafely(
    browser: Browser | undefined,
  ): Promise<void> {
    if (!browser) return;
    try {
      await browser.close();
    } catch (closeError) {
      this.logger.error({
        message: 'Error closing browser',
        error:
          closeError instanceof Error ? closeError.message : String(closeError),
      });
    }
  }

  private isBrowserLaunchError(error: unknown): boolean {
    return (
      error instanceof Error &&
      error.message.includes('Failed to launch the browser process!')
    );
  }
}
