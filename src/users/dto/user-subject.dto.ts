import { ApiProperty } from '@nestjs/swagger';
import { UserAbsence } from '../../absences/entities/absence.entity';
import { SubjectClass } from '../../subjects/entities/subject-class.entity';

export class UserSubjectDto {
  @ApiProperty({
    example: 1,
    description: 'ID da disciplina do usuário',
    required: false,
  })
  id?: number;

  @ApiProperty({
    type: [UserAbsence],
    description: 'Lista de faltas do usuário na disciplina',
    required: false,
    example: [
      {
        id: 1,
        date: '2026-02-05T10:00:00.000Z',
        createdAt: '2026-02-05T10:00:00.000Z',
        userId: 1,
        userSubjectId: 1,
      },
    ],
  })
  absences?: UserAbsence[];

  @ApiProperty({
    example: 8.5,
    description: 'Nota/conceito do usuário na disciplina',
    required: false,
  })
  grading?: number;

  @ApiProperty({
    description: 'Informações da turma da disciplina',
    example: {
      id: 1,
      availableDays: [
        {
          day: 'Segunda-feira',
          start: '08:00',
          end: '10:00',
          classRoom: 'Sala 101',
        },
      ],
      subject: {
        id: 1,
        name: 'Cálculo I',
        code: 'MAT001',
      },
      observations: 'Turma da manhã',
    },
  })
  subjectClass: SubjectClass;

  constructor(
    subjectClass: SubjectClass,
    id?: number,
    absences?: UserAbsence[],
    grading?: number,
  ) {
    this.subjectClass = subjectClass;
    this.id = id;
    this.absences = absences;
    this.grading = grading;
  }
}
