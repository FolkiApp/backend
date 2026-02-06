import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { GradesRepository } from '../repositories/grades.repository';
import { UserSubjectsRepository } from '../../subjects/repositories/user-subjects.repository';
import { Grade } from '../entities/grade.entity';
import { UserSubjectNotFoundException } from '../exceptions/user-subject-not-found.exception';
import { GradesFetchException } from '../exceptions/grades-fetch.exception';

@Injectable()
export class GetAllGradesFromSubjectService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly gradesRepository: GradesRepository,
    private readonly userSubjectsRepository: UserSubjectsRepository,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(GetAllGradesFromSubjectService.name);
  }

  async execute(user: AuthUser, userSubjectId: number): Promise<Grade[]> {
    this.logger.log({
      message: 'Executing getAllGradesFromSubject',
      userId: user.id,
      userSubjectId,
    });

    await this.verifyUserSubject(user.id, userSubjectId);
    const grades = await this.fetchGrades(userSubjectId);

    this.logger.log({
      message: 'Successfully fetched grades',
      userId: user.id,
      userSubjectId,
      count: grades.length,
    });

    return grades;
  }

  private async verifyUserSubject(
    userId: number,
    userSubjectId: number,
  ): Promise<void> {
    let userSubject;

    try {
      userSubject = await this.userSubjectsRepository.findByIdAndUserId(
        userSubjectId,
        userId,
      );
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error verifying user subject',
        userId,
        userSubjectId,
        error: error instanceof Error ? error.message : error,
      });

      throw new GradesFetchException();
    }

    if (!userSubject) {
      throw new UserSubjectNotFoundException();
    }
  }

  private async fetchGrades(userSubjectId: number): Promise<Grade[]> {
    try {
      return await this.gradesRepository.findAllByUserSubject(userSubjectId);
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error fetching grades',
        userSubjectId,
        error: error instanceof Error ? error.message : error,
      });

      throw new GradesFetchException();
    }
  }
}
