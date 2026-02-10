import { ApiProperty } from '@nestjs/swagger';
import { AbsenceDto } from './absence.dto';

export class AbsencesResponseDto {
  @ApiProperty({ type: [AbsenceDto], description: 'Lista de faltas' })
  absences: AbsenceDto[];

  constructor(absences: AbsenceDto[]) {
    this.absences = absences;
  }
}
