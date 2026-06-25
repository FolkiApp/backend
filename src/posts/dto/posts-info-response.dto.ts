import { ApiProperty } from '@nestjs/swagger';

export class PostsInfoResponseDto {
  @ApiProperty({
    example: 5,
    description: 'Número de postagens criadas nas últimas 24 horas',
  })
  newPosts: number;

  constructor(newPosts: number) {
    this.newPosts = newPosts;
  }
}
