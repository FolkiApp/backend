import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ActivityType } from './create-activity.dto';

export class UpdateActivityDto {
  @ApiProperty({ example: 'Trabalho de Cálculo', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Resolver exercícios 1-10', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 10, required: false, nullable: true })
  @IsNumber()
  @IsOptional()
  value?: number | null;

  @ApiProperty({
    enum: ActivityType,
    example: ActivityType.HOMEWORK,
    required: false,
  })
  @IsEnum(ActivityType)
  @IsOptional()
  type?: ActivityType;

  @ApiProperty({ example: '2025-12-31', required: false })
  @IsDateString()
  @IsOptional()
  finishDate?: string;

  @ApiProperty({ example: false, default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}
