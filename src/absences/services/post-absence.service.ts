import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { AbsenceRepository } from '../repositories/absence.repository';
import { UserAbsence } from '../entities/absence.entity';
import { InvalidSubjectIdException } from '../../subjects/exceptions/subject-fetch-id.exception';
import { UserSubjectRepository } from '../../users/repositories/user-subject.repository';
import { AbsenceInternalErrorException } from '../exceptions/absence-internal-error.exception';

@Injectable()
export class PostAbsence {
  private readonly logger = new Logger(PostAbsence.name);

  constructor(
    private readonly absenceRepository: AbsenceRepository,
    private readonly userSubjectRepository: UserSubjectRepository,
  ) {}

  async execute(
    user: AuthUser,
    subjectId: number,
    date: Date,
  ): Promise<UserAbsence> {
    this.logger.log({ message: 'Executing post absence per subject' });
    const userSubject = await this.findUserSubject(user.id, subjectId);
    return this.postAbsence(user.id, userSubject.id, date);
  }

  private async postAbsence(
    userId: number,
    userSubjectId: number,
    date: Date,
  ): Promise<UserAbsence> {
    try {
      const absences = await this.absenceRepository.postAbsence(
        userId,
        userSubjectId,
        date,
      );
      this.logger.log({
        message: 'Successfully posted absence',
        userId: userId,
        absences: absences.id,
      });

      return absences;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error posting subject absences',
        error: error instanceof Error ? error.message : error,
      });

      throw new AbsenceInternalErrorException();
    }
  }

  private async findUserSubject(
    userId: number,
    subjectId: number,
  ): Promise<{ id: number }> {
    let userSubject: { id: number } | null | undefined;
    try {
      userSubject = await this.userSubjectRepository.findByUserAndSubjectClass(
        userId,
        subjectId,
      );
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error fetching subject',
        subjectId,
        error: error instanceof Error ? error.message : error,
      });

      throw new AbsenceInternalErrorException();
    }
    if (!userSubject) {
      throw new InvalidSubjectIdException();
    }
    return userSubject;
  }
}
