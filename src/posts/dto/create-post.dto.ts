import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    example: 'Meu Primeiro Post',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Minha primeira postagem no Mural do Folki!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: ['Value', 'Value2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tags: string[];

  @ApiPropertyOptional({
    example: 10,
    description: 'ID do post pai (para criar um node filho)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  parentId?: number;
}
