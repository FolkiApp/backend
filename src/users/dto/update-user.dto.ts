import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsNotEmpty,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'João da Silva' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  instituteId?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  courseId?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  universityId?: number;

  @ApiPropertyOptional({ example: '1.0.0' })
  @IsOptional()
  @IsString()
  userVersion?: string;

  @ApiPropertyOptional({ example: 'abc123-def456-ghi789' })
  @IsOptional()
  @IsString()
  notificationId?: string;
}
