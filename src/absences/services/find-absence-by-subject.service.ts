import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { AbsenceRepository } from '../repositories/absence.repository';
import { UserAbsence } from '../entities/absence.entity';
import { SubjectRepository } from '../../subjects/repositories/subject.repository';
import { InvalidSubjectIdException } from '../../subjects/exceptions/subject-fetch-id.exception';
import { AbsenceBySubjectException } from '../exceptions/absence-by-subject.exception';

@Injectable()
export class AbsenceBySubjectService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly absenceRepository: AbsenceRepository,
    private readonly subjectRepository: SubjectRepository,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(AbsenceBySubjectService.name);
  }

  async execute(user: AuthUser, subjectId: number): Promise<UserAbsence[]> {
    this.logger.log({ message: 'Executing findAllAbsences per subject' });
    await this.findSubject(subjectId);
    return this.findAllBySubject(user.id, subjectId);
  }

  private async findAllBySubject(
    userId: number,
    subjectId: number,
  ): Promise<UserAbsence[]> {
    try {
      const absences = await this.absenceRepository.findBySubject(
        userId,
        subjectId,
      );
      this.logger.log({
        message: 'Successfully fetched subject absences',
        userId: userId,
        absences: absences.length,
      });

      return absences;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error fetching subject absences',
        error: error instanceof Error ? error.message : error,
      });

      throw new AbsenceBySubjectException();
    }
  }

  private async findSubject(subjectId: number) {
    try {
      const subject = await this.subjectRepository.findById(subjectId);

      if (!subject) {
        this.logger.warn({
          message: 'Invalid SubjectID',
          subjectId,
        });
        throw new InvalidSubjectIdException();
      }

      return subject;
    } catch (error: unknown) {
      if (error instanceof InvalidSubjectIdException) {
        throw error;
      }

      this.logger.error({
        message: 'Error fetching subject',
        subjectId,
        error: error instanceof Error ? error.message : error,
      });

      throw new AbsenceBySubjectException();
    }
  }
}
