import { ApiProperty } from '@nestjs/swagger';
import { PostDto } from './post.dto';

export class ListPostResponseDto {
  @ApiProperty({
    type: [PostDto],
    description: 'Lista de posts',
  })
  posts: PostDto[];

  @ApiProperty({
    example: 42,
    nullable: true,
    description:
      'ID do próximo post para paginação, ou null se não houver mais posts',
  })
  nextId: number | null;
}
