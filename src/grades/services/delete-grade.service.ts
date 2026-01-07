import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { GradesRepository } from '../repositories/grades.repository';
import { UserSubjectsRepository } from '../../subjects/repositories/user-subjects.repository';
import { Grade } from '../entities/grade.entity';
import { GradeNotFoundException } from '../exceptions/grade-not-found.exception';
import { PermissionDeniedToDeleteGradeException } from '../exceptions/permission-denied-to-delete-grade.exception';
import { UserBlockedException } from '../../activities/exceptions/user-blocked.exception';
import { GradeDeleteException } from '../exceptions/grade-delete.exception';

@Injectable()
export class DeleteGradeService {
  private readonly logger = new Logger(DeleteGradeService.name);

  constructor(
    private readonly gradesRepository: GradesRepository,
    private readonly userSubjectsRepository: UserSubjectsRepository,
  ) {}

  async execute(user: AuthUser, gradeId: number): Promise<void> {
    this.logger.log({
      message: 'Executing deleteGrade',
      userId: user.id,
      gradeId,
    });

    if (user.isBlocked) throw new UserBlockedException();

    const grade = await this.findGrade(gradeId);
    await this.verifyUserSubjectOwnership(user.id, grade.userSubjectId);

    await this.deleteGrade(gradeId);

    this.logger.log({
      message: 'Successfully deleted grade',
      userId: user.id,
      gradeId,
    });
  }

  private async findGrade(gradeId: number): Promise<Grade> {
    let grade: Grade | null;

    try {
      grade = await this.gradesRepository.findById(gradeId);
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error finding grade',
        gradeId,
        error: error instanceof Error ? error.message : error,
      });

      throw new GradeDeleteException();
    }

    if (!grade) {
      throw new GradeNotFoundException();
    }

    return grade;
  }

  private async verifyUserSubjectOwnership(
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
        message: 'Error verifying user subject ownership',
        userId,
        userSubjectId,
        error: error instanceof Error ? error.message : error,
      });

      throw new GradeDeleteException();
    }

    if (!userSubject) {
      throw new PermissionDeniedToDeleteGradeException();
    }
  }

  private async deleteGrade(gradeId: number): Promise<void> {
    try {
      await this.gradesRepository.delete(gradeId);
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error deleting grade',
        gradeId,
        error: error instanceof Error ? error.message : error,
      });

      throw new GradeDeleteException();
    }
  }
}
