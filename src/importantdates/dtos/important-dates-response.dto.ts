import { ApiProperty } from '@nestjs/swagger';
import { ImportantDateResponseDto } from './important-date.dto';

export class ImportantDatesResponseDto {
  @ApiProperty({
    type: [ImportantDateResponseDto],
    description: 'Lista de datas importantes',
  })
  importantDates: ImportantDateResponseDto[];

  constructor(importantDates: ImportantDateResponseDto[]) {
    this.importantDates = importantDates;
  }
}
