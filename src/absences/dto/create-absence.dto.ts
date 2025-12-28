import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class CreateAbsenceDto {
  @ApiProperty({
    example: '2025-03-10T00:00:00.000Z',
    description: 'Data da falta',
  })
  @IsDateString()
  date: string;
}
