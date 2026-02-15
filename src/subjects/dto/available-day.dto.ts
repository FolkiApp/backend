import { ApiProperty } from '@nestjs/swagger';

export class AvailableDayDto {
  @ApiProperty({ example: 'Segunda-feira', description: 'Dia da semana' })
  day: string;

  @ApiProperty({ example: '08:00', description: 'Horário de início' })
  start: string;

  @ApiProperty({ example: '10:00', description: 'Horário de término' })
  end: string;

  @ApiProperty({
    example: 'Sala 101',
    description: 'Sala de aula',
    required: false,
  })
  classRoom?: string;

  constructor(day: string, start: string, end: string, classRoom?: string) {
    this.day = day;
    this.start = start;
    this.end = end;
    this.classRoom = classRoom;
  }
}
