import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsNumber,
} from 'class-validator';

export enum ActivityType {
  EXAM = 'EXAM',
  HOMEWORK = 'HOMEWORK',
  ACTIVITY = 'ACTIVITY',
  LIST = 'LIST',
}

export class CreateActivityDto {
  @ApiProperty({ example: 'Trabalho de Cálculo' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Resolver exercícios 1-10' })
  @IsString()
  description: string;

  @ApiProperty({ example: 10, required: false, nullable: true })
  @IsNumber()
  @IsOptional()
  value?: number | null;

  @ApiProperty({ example: 1 })
  @IsInt()
  subjectClassId: number;

  @ApiProperty({ enum: ActivityType, example: ActivityType.HOMEWORK })
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiProperty({ example: '2025-12-31' })
  @IsDateString()
  finishDate: string;

  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}
