import { ApiProperty } from '@nestjs/swagger';
import { ImportDateType } from '@prisma/client';

export class ImportantDateResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Semester start' })
  name: string;

  @ApiProperty({
    example: '2025-03-10T00:00:00.000Z',
    description: 'Date of the important event',
  })
  date: Date;

  @ApiProperty({
    example: ImportDateType.GENERAL,
    enum: ImportDateType,
  })
  type: ImportDateType;

  @ApiProperty({ example: true })
  shouldNotify: boolean;

  @ApiProperty({ nullable: true, example: 5 })
  campusId: number | null;

  @ApiProperty({ nullable: true, example: 12 })
  universityId: number | null;

  constructor(
    id: number,
    name: string,
    date: Date,
    type: ImportDateType,
    shouldNotify: boolean,
    campusId: number | null,
    universityId: number | null,
  ) {
    this.id = id;
    this.name = name;
    this.date = date;
    this.type = type;
    this.shouldNotify = shouldNotify;
    this.campusId = campusId;
    this.universityId = universityId;
  }
}
