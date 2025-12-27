import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { AbsenceRepository } from '../repositories/absence.repository';
import { UserAbsence } from '../entities/absence.entity';
import { InvalidUniversityException } from 'src/common/exceptions/invalid-university.exception';
import { SubjectRepository } from 'src/subjects/repositories/subject.repository';
import { InvalidSubjectIdException } from 'src/subjects/exceptions/subject-fetch-id.exception';
import { AbsenceBySubjectException } from '../exceptions/absence-by-subject.exception';

@Injectable()
export class AbsenceBySubjectService {
  private readonly logger = new Logger(AbsenceBySubjectService.name);

  constructor(
    private readonly absenceRepository: AbsenceRepository,
    private readonly subjectRepository: SubjectRepository,
  ) {}

  async execute(user: AuthUser, subjectId: number): Promise<UserAbsence[]> {
    this.logger.log({ message: 'Executing findAllAbsences per subject' });

    if (!user.universityId) {
      this.logger.warn({
        message: 'Invalid university ID for user',
        userId: user.id,
      });
      throw new InvalidUniversityException();
    }
    let subject = this.subjectRepository.findById(subjectId);
    if (!subject) {
      this.logger.warn({
        message: 'Invalid SubjectID',
        subjectId: subjectId,
      });
      throw new InvalidSubjectIdException();
    }

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
      return subjects;
    } catch (error) {
      this.logger.error({
        message: 'Error fetching subject absences',
        error: error,
      });
      throw new AbsenceBySubjectException();
    }
  }
}
