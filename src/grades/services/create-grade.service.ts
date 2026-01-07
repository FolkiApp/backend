import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { GradesRepository } from '../repositories/grades.repository';
import { UserSubjectsRepository } from '../../subjects/repositories/user-subjects.repository';
import { CreateGradeDto } from '../dto/create-grade.dto';
import { Grade } from '../entities/grade.entity';
import { UserSubjectNotFoundException } from '../exceptions/user-subject-not-found.exception';
import { GradeCreateException } from '../exceptions/grade-create.exception';

@Injectable()
export class CreateGradeService {
  private readonly logger = new Logger(CreateGradeService.name);

  constructor(
    private readonly gradesRepository: GradesRepository,
    private readonly userSubjectsRepository: UserSubjectsRepository,
  ) {}

  async execute(
    user: AuthUser,
    createGradeDto: CreateGradeDto,
  ): Promise<Grade> {
    this.logger.log({
      message: 'Executing createGrade',
      userId: user.id,
      userSubjectId: createGradeDto.userSubjectId,
    });

    await this.verifyUserSubject(user.id, createGradeDto.userSubjectId);

    const grade = await this.createGrade(createGradeDto);

    this.logger.log({
      message: 'Successfully created grade',
      userId: user.id,
      gradeId: grade.id,
    });

    return grade;
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

      throw new GradeCreateException();
    }

    if (!userSubject) {
      throw new UserSubjectNotFoundException();
    }
  }

  private async createGrade(createGradeDto: CreateGradeDto): Promise<Grade> {
    try {
      const grade = await this.gradesRepository.create({
        userSubjectId: createGradeDto.userSubjectId,
        name: createGradeDto.name,
        percentage: createGradeDto.percentage,
        value: createGradeDto.value,
      });

      return grade;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error creating grade',
        userSubjectId: createGradeDto.userSubjectId,
        error: error instanceof Error ? error.message : error,
      });

      throw new GradeCreateException();
    }
  }
}
