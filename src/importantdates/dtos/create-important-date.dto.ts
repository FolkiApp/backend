import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsInt,
  IsDateString,
} from 'class-validator';
import { ImportantDateType } from '../entities/important-date-type.entity';

export class CreateImportantDateDto {
  @ApiProperty({ example: 'Semester start' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: '2025-03-10T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({
    enum: ImportantDateType,
    example: ImportantDateType.GENERAL,
  })
  @IsEnum(ImportantDateType)
  type: ImportantDateType;

  @ApiProperty({ example: true })
  @IsBoolean()
  shouldNotify: boolean;

  @ApiProperty({ nullable: true, example: 5 })
  @IsOptional()
  @IsInt()
  campusId: number | null;

  @ApiProperty({ nullable: true, example: 12 })
  @IsOptional()
  @IsInt()
  universityId: number | null;
}
