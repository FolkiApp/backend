import { Injectable } from '@nestjs/common';
import { user } from '@prisma/client';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { UserRepository } from '../repositories/user.repository';
import { CourseRepository } from '../../courses/repositories/course.repository';
import { InstituteRepository } from '../../institutes/repositories/institute.repository';
import { SubjectRepository } from '../../subjects/repositories/subject.repository';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { UserSubjectRepository } from '../repositories/user-subject.repository';

const UFSCAR_UNIVERSITY_ID = 2;
const sigaaUrl = `https://www.sistemas.ufscar.br/sagui-api`;

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

    const response = await fetch(`${sigaaUrl}/v1/ensino/turmas`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    this.logger.log({
      message: 'SIGAA response received, processing data',
      ra,
    });
    const responseBody = await response.json();

    const { nome, email } = responseBody.usuarioLogado;
    const { curso, instituto, turmas } = responseBody;

    const dbInstitute = await this.instituteRepository.findOrCreate(
      instituto,
      UFSCAR_UNIVERSITY_ID,
    );

    const dbCourse = await this.courseRepository.findOrCreate(
      curso,
      UFSCAR_UNIVERSITY_ID,
    );

    const subjectCodes = turmas.map((turma: any) => turma.codigoDisciplina);
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
      const turma = turmas.find((t: any) => t.codigoDisciplina === subjectCode);
      const newSubject = await this.subjectRepository.create(
        subjectCode,
        turma.nomeDisciplina,
        UFSCAR_UNIVERSITY_ID,
      );
      subjectsAlreadyRegistered.push(newSubject);
    }

    const subjectClasses = turmas.map((turma: any) => {
      const subject = subjectsAlreadyRegistered.find(
        (s) => s.code === turma.codigoDisciplina,
      );

      return {
        subjectId: subject!.id,
        availableDays: turma.horarios.map((h: any) => ({
          day: h.diaSemana.toLowerCase(),
          start: h.horaInicio,
          end: h.horaFim,
        })),
        observations: turma.observacoes || '',
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

      if (nome !== user.name) {
        user = await this.userRepository.updateName(user.id, nome);
      }
    }

    if (!user) {
      user = await this.userRepository.create(
        email,
        nome,
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
