import { ApiProperty } from '@nestjs/swagger';

export class AbsenceDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({
    example: '2025-03-10T00:00:00.000Z',
    description: 'Data da falta',
  })
  date: Date;

  @ApiProperty({
    example: '2025-03-10T12:30:00.000Z',
    description: 'Data de criação do registro',
  })
  createdAt: Date;

  @ApiProperty({ example: 3 })
  userId: number;

  @ApiProperty({ example: 7 })
  userSubjectId: number;

  constructor(
    id: number,
    date: Date,
    createdAt: Date,
    userId: number,
    userSubjectId: number,
  ) {
    this.id = id;
    this.date = date;
    this.createdAt = createdAt;
    this.userId = userId;
    this.userSubjectId = userSubjectId;
  }
}
