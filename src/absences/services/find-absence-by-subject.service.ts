import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { AbsenceRepository } from '../repositories/absence.repository';
import { UserAbsence } from '../entities/absence.entity';
import { SubjectRepository } from 'src/subjects/repositories/subject.repository';
import { InvalidSubjectIdException } from 'src/subjects/exceptions/subject-fetch-id.exception';
import { AbsenceBySubjectException } from '../exceptions/absence-by-subject.exception';
import { NotFoundAbsences } from '../exceptions/absence-not-found.exception';

@Injectable()
export class AbsenceBySubjectService {
  private readonly logger = new Logger(AbsenceBySubjectService.name);

  constructor(
    private readonly absenceRepository: AbsenceRepository,
    private readonly subjectRepository: SubjectRepository,
  ) {}

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
      const subjects = await this.absenceRepository.findBySubject(
        userId,
        subjectId,
      );
      this.logger.log({
        message: 'Successfully fetched subject absences',
        userId: userId,
        absences: subjects.length,
      });
      if (subjects.length == 0) {
        this.logger.error({
          message: 'Not found any absences',
          userId: userId,
        });
        throw new NotFoundAbsences();
      }
      return subjects;
    } catch (error: unknown) {
      if (error instanceof NotFoundAbsences) {
        throw error;
      }

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
      this.logger.error({
        message: 'Error fetching subject',
        subjectId,
        error: error instanceof Error ? error.message : error,
      });
      throw new InvalidSubjectIdException();
    }
  }
}
