import { ApiProperty } from '@nestjs/swagger';

export class GradeDto {
  @ApiProperty({
    description: 'ID da nota',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nome da nota',
    example: 'Prova 1',
  })
  name: string;

  @ApiProperty({
    description: 'Valor da nota',
    example: 8.5,
  })
  value: number;

  @ApiProperty({
    description: 'ID da matéria do usuário',
    example: 1,
  })
  userSubjectId: number;

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-12-31T15:00:00.000Z',
  })
  createdAt: Date;
}

export class GradesResponseDto {
  @ApiProperty({
    description: 'Lista de notas',
    type: [GradeDto],
  })
  grades: GradeDto[];
}
