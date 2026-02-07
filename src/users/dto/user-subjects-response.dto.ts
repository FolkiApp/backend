import { ApiProperty } from '@nestjs/swagger';
import { UserSubjectDto } from './user-subject.dto';

export class UserSubjectsResponseDto {
  @ApiProperty({
    type: [UserSubjectDto],
    description: 'Lista de disciplinas do usuário',
  })
  userSubjects: UserSubjectDto[];

  constructor(userSubjects: UserSubjectDto[]) {
    this.userSubjects = userSubjects;
  }
}
