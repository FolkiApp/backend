import { ApiProperty } from '@nestjs/swagger';

export class PostDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({
    example: '2025-03-10T12:30:00.000Z',
    description: 'Data de criação do post',
  })
  postDate: Date;

  @ApiProperty({
    example: 'Minha primeira postagem no Mural do Folki!',
    description: 'Conteúdo da postagem',
  })
  content: string;

  @ApiProperty({ example: 3 })
  userId: number;

  @ApiProperty({ example: 'João Silva' })
  userName: string;

  @ApiProperty({ example: 10, nullable: true })
  parentId?: number | null;

  @ApiProperty({ example: 21 })
  commentsCount: number;

  @ApiProperty({
    example: ['Value', 'Value2'],
    type: [String],
  })
  tags: string[];

  constructor(
    id: number,
    postDate: Date,
    content: string,
    userId: number,
    userName: string,
    parentId: number | null,
    commentsCount: number,
    tags?: string[],
  ) {
    this.id = id;
    this.postDate = postDate;
    this.content = content;
    this.userId = userId;
    this.userName = userName;
    this.parentId = parentId;
    this.commentsCount = commentsCount;
    this.tags = tags ?? [];
  }
}
