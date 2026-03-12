import { Injectable } from '@nestjs/common';
import { user } from '@prisma/client';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { InvalidCredentialsException } from '../../common/exceptions/invalid-credentials.exception';
import { UserRepository } from '../repositories/user.repository';
import { CourseRepository } from '../../courses/repositories/course.repository';
import { InstituteRepository } from '../../institutes/repositories/institute.repository';
import { SubjectRepository } from '../../subjects/repositories/subject.repository';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { UserSubjectRepository } from '../repositories/user-subject.repository';

const UFSCAR_UNIVERSITY_ID = 2;
const sigaaUrl = `https://sistemas.ufscar.br/sagui-api`;

@Injectable()
export class AccessUFSCarSigaaService {
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
    this.logger.setContext(AccessUFSCarSigaaService.name);
  }

  async execute(ra: string, password: string): Promise<user> {
    const credentials = Buffer.from(`${ra}:${password}`).toString('base64');

    const deferimentoResponse = await fetch(`${sigaaUrl}/siga/deferimento`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    this.logger.log({
      message: 'Requesting SIGAA deferimento data',
      status: deferimentoResponse.status,
    });

    if (!deferimentoResponse.ok) {
      throw new InvalidCredentialsException();
    }

    const deferimentoData = await deferimentoResponse.json();
    const enrollments = deferimentoData.data || [];

    const carteiraResponse = await fetch(
      `${sigaaUrl}/carteirinha/listar?id=&somenteAtivos=true`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      },
    );

    if (!carteiraResponse.ok) {
      throw new InvalidCredentialsException();
    }

    const carteiraData = await carteiraResponse.json();
    const userData = carteiraData.data[0];
    const name = userData.nomeSocial || userData.nome;
    const institute = userData.unidade;

    const detailsResponse = await fetch(`${sigaaUrl}/core/usuario/detalhes`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    if (!detailsResponse.ok) {
      throw new InvalidCredentialsException();
    }

    const detailsData = await detailsResponse.json();
    const email = detailsData.details.email;
    const course = 'Bacharelado UFSCar';

    this.logger.log({
      message: 'SIGAA data received, processing',
      ra,
      enrollmentsCount: enrollments.length,
    });

    const dbInstitute = await this.instituteRepository.findOrCreate(
      institute,
      UFSCAR_UNIVERSITY_ID,
    );

    const dbCourse = await this.courseRepository.findOrCreate(
      course,
      UFSCAR_UNIVERSITY_ID,
    );

    // Map subject codes (use activity as unique code)
    const subjectCodes = enrollments.map(
      (enrollment: any) => enrollment.atividade,
    );
    const subjectsAlreadyRegistered =
      await this.subjectRepository.findManyByCodes(subjectCodes);
    const notRegisteredSubjectCodes = subjectCodes.filter(
      (subjectCode: string) =>
        !subjectsAlreadyRegistered.find(
          (subject) => subject.code === subjectCode,
        ),
    );

    this.logger.log({
      message: 'Registering new subjects',
      ra,
      newSubjectsCount: notRegisteredSubjectCodes.length,
      totalSubjects: subjectCodes.length,
    });

    for (const subjectCode of notRegisteredSubjectCodes) {
      const enrollment = enrollments.find(
        (e: any) => e.atividade === subjectCode,
      );
      const newSubject = await this.subjectRepository.create(
        subjectCode,
        enrollment.atividade, // use activity as name too
        UFSCAR_UNIVERSITY_ID,
      );
      subjectsAlreadyRegistered.push(newSubject);
    }

    const subjectClasses = enrollments.map((enrollment: any) => {
      const subject = subjectsAlreadyRegistered.find(
        (s) => s.code === enrollment.atividade,
      );

      // Map weekdays from Portuguese to lowercase
      const dayMap: { [key: string]: string } = {
        SEGUNDA: 'seg',
        TERCA: 'ter',
        QUARTA: 'qua',
        QUINTA: 'qui',
        SEXTA: 'sex',
        SÁBADO: 'sab',
        DOMINGO: 'dom',
      };

      // Format time from HH:MM:SS to HH:MM
      const formatTime = (time: string) => {
        return time.substring(0, 5);
      };

      const availableDays = enrollment.horarios.map((schedule: any) => ({
        day: dayMap[schedule.dia] || schedule.dia.toLowerCase(),
        start: formatTime(schedule.inicio),
        end: formatTime(schedule.fim),
        classRoom: schedule.sala || '',
      }));

      return {
        subjectId: subject!.id,
        availableDays: availableDays,
        observations: '',
      };
    });

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
          UFSCAR_UNIVERSITY_ID,
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
        UFSCAR_UNIVERSITY_ID,
        subjectClass.observations,
      );

      subjectClassesIds.push(newSubjectClass.id);
    }

    let user = await this.userRepository.findByEmail(email);

    if (user) {
      const userSubjectClasses =
        await this.userSubjectRepository.findManyByUserId(user.id);
      const userSubjectClassesIds = userSubjectClasses.map(
        (usc) => usc.subjectClassId,
      );
      const userSubjectClassesToRemove = userSubjectClassesIds.filter(
        (uscId) => !subjectClassesIds.includes(uscId),
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
        dbCourse.id,
        dbInstitute.id,
        UFSCAR_UNIVERSITY_ID,
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
        await this.userSubjectRepository.restore(user.id, subjectClassId);
        this.logger.log({
          message: 'Restored deleted user subject',
          userId: user.id,
          subjectClassId,
        });
      }
    }

    this.logger.log({
      message: 'UFSCar user processed successfully',
      userId: user.id,
      email: user.email,
      ra,
      courseId: user.courseId,
      instituteId: user.instituteId,
      subjectClassesCount: subjectClassesIds.length,
    });
    return user;
  }
}
