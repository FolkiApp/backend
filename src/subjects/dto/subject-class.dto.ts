import { ApiProperty } from '@nestjs/swagger';
import { AvailableDayDto } from './available-day.dto';
import { SubjectDto } from './subject.dto';

export class SubjectClassDto {
  @ApiProperty({ example: 1, description: 'ID da turma' })
  id: number;

  @ApiProperty({
    type: [AvailableDayDto],
    description: 'Dias e horários da turma',
  })
  availableDays: AvailableDayDto[];

  @ApiProperty({ type: SubjectDto, description: 'Disciplina' })
  subject: SubjectDto;

  @ApiProperty({
    example: 'Sala 101',
    description: 'Observações sobre a turma',
    required: false,
  })
  observations?: string;

  constructor(
    id: number,
    availableDays: AvailableDayDto[],
    subject: SubjectDto,
    observations?: string,
  ) {
    this.id = id;
    this.availableDays = availableDays;
    this.subject = subject;
    this.observations = observations;
  }
}
