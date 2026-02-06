import { Injectable } from '@nestjs/common';
import { UserSubjectRepository } from '../repositories/user-subject.repository';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { UserSubject } from '../entities/user-subject.entity';
import { FindUserSubjectsException } from '../exceptions/find-user-subjects.exception';

@Injectable()
export class FindUserSubjectsService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly userSubjectRepository: UserSubjectRepository,
    private readonly subjectClassRepository: SubjectClassRepository,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(FindUserSubjectsService.name);
  }

  async execute(userId: number, universityId: number): Promise<UserSubject[]> {
    this.logger.log({
      message: 'Executing find user subjects',
      userId,
      universityId,
    });

    return this.find(userId, universityId);
  }

  private async find(
    userId: number,
    universityId: number,
  ): Promise<UserSubject[]> {
    try {
      const latestClass =
        await this.subjectClassRepository.findLatest(universityId);

      if (!latestClass) {
        this.logger.warn({
          message: 'No subject class found',
          userId,
          universityId,
        });
        return [];
      }

      return this.userSubjectRepository.findByUserAndClass(
        userId,
        latestClass.year,
        latestClass.semester,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        {
          message: 'Error while finding user subjects',
          userId,
          error: errorMessage,
        },
        errorStack,
      );

      throw new FindUserSubjectsException(
        'Erro ao buscar disciplinas do usuário',
      );
    }
  }
}
