import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUniversityDto {
  @ApiProperty({ example: 'Universidade de São Paulo' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'usp' })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({ example: 'https://logo.com/usp.png' })
  @IsNotEmpty()
  @IsString()
  logo: string;
}
