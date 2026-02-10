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
    example: null,
    description: 'ID do post pai (null se for um post raiz)',
    nullable: true,
  })
  parentPostId: number | null;

  @ApiProperty({
    example: ['Value', 'Value2'],
    type: [String],
  })
  tags: string[];

  constructor(
    id: number,
    postDate: Date,
    title: string,
    content: string,
    userId: number,
    parentPostId: number | null,
    tags?: string[],
  ) {
    this.id = id;
    this.postDate = postDate;
    this.title = title;
    this.content = content;
    this.userId = userId;
    this.parentPostId = parentPostId;
    this.tags = tags ?? [];
  }
}
