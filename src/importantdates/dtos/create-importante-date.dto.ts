import { ApiProperty } from '@nestjs/swagger';
import { ImportDateType } from '@prisma/client';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateImportantDateDto {
  @ApiProperty({ example: 'Semester start' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: '2025-03-10T00:00:00.000Z',
    description: 'Date of the important event',
  })
  @IsNotEmpty()
  @IsString()
  date: Date;

  @ApiProperty({
    example: ImportDateType.GENERAL,
    enum: ImportDateType,
  })
  @IsNotEmpty()
  @IsString()
  type: ImportDateType;

  @ApiProperty({ example: true })
  shouldNotify: boolean;

  @ApiProperty({ nullable: true, example: 5 })
  campusId: number | null;

  @ApiProperty({ nullable: true, example: 12 })
  universityId: number | null;

  constructor(
    name: string,
    date: Date,
    type: ImportDateType,
    shouldNotify: boolean,
    campusId: number | null,
    universityId: number | null,
  ) {
    this.name = name;
    this.date = date;
    this.type = type;
    this.shouldNotify = shouldNotify;
    this.campusId = campusId;
    this.universityId = universityId;
  }
}
