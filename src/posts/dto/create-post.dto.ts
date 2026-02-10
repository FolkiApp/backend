import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  IsOptional,
  IsNumber,
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

  @ApiProperty({
    example: null,
    description:
      'ID do post pai (opcional - usado para criar respostas/comentários)',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  parentPostId?: number;
}
