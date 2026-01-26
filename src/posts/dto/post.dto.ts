import { ApiProperty } from '@nestjs/swagger';
import { CommentEntity } from 'src/comments/entities/comment.entity';

export class PostDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({
    example: '2025-03-10T12:30:00.000Z',
    description: 'Data de criação do post',
  })
  postDate: Date;

  @ApiProperty({
    example: 'Meu Primeiro Post',
    description: 'Título da postagem',
  })
  title: string;

  @ApiProperty({
    example: 'Minha primeira postagem no Mural do Folki!',
    description: 'Conteúdo da postagem',
  })
  content: string;

  @ApiProperty({ example: 3 })
  userId: number;

  @ApiProperty({
    example: 21,
  })
  commentsCount: number;

  @ApiProperty({
    example: [],
    type: [CommentEntity],
  })
  comments: CommentEntity[];

  constructor(
    id: number,
    postDate: Date,
    title: string,
    content: string,
    userId: number,
    commentsCount: number,
    comments: CommentEntity[] = [],
  ) {
    this.id = id;
    this.postDate = postDate;
    this.title = title;
    this.content = content;
    this.userId = userId;
    this.commentsCount = commentsCount;
    this.comments = comments;
  }
}
