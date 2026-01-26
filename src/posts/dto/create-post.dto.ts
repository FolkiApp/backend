import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

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
}
