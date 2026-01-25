import { Injectable, Logger } from '@nestjs/common';
import { UserSubjectRepository } from '../repositories/user-subject.repository';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { UserSubject } from '../entities/user-subject.entity';

@Injectable()
export class FindUserSubjectsService {
  private readonly logger = new Logger(FindUserSubjectsService.name);

  constructor(
    private readonly userSubjectRepository: UserSubjectRepository,
    private readonly subjectClassRepository: SubjectClassRepository,
  ) {}

  async execute(userId: number): Promise<UserSubject[]> {
    this.logger.log({ message: 'Executing find user subjects' });
    return this.find(userId);
  }

  private async find(userId: number): Promise<UserSubject[]> {
    const latestClass = await this.subjectClassRepository.findLatest();
    if (!latestClass) return [];

    return this.userSubjectRepository.findByUserAndClass(
      userId,
      latestClass.year,
      latestClass.semester,
    );
  }
}
