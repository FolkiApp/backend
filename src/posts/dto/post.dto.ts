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

  @ApiProperty({
    example: 'Instituto de Ciências Matemáticas e de Computação',
    nullable: true,
  })
  userInstituteName: string | null;

  @ApiProperty({ example: 10, nullable: true })
  parentId?: number | null;

  @ApiProperty({ example: 21 })
  commentsCount: number;

  @ApiProperty({ example: 15 })
  upvotes: number;

  @ApiProperty({ example: 3 })
  downvotes: number;

  @ApiProperty({
    example: 'up',
    nullable: true,
    description: 'Voto do usuário no post (up, down ou null)',
  })
  voted: 'up' | 'down' | null;

  @ApiProperty({
    example: ['Value', 'Value2'],
    type: [String],
  })
  tags: string[];

  @ApiProperty({
    example: ['https://s3.amazonaws.com/bucket/image1.jpg'],
    type: [String],
    description: 'URLs das imagens do post',
  })
  imageUrls: string[];

  constructor(
    id: number,
    postDate: Date,
    content: string,
    userId: number,
    userName: string,
    userInstituteName: string | null,
    parentId: number | null,
    commentsCount: number,
    tags?: string[],
    imageUrls?: string[],
    upvotes = 0,
    downvotes = 0,
    voted: 'up' | 'down' | null = null,
  ) {
    this.id = id;
    this.postDate = postDate;
    this.content = content;
    this.userId = userId;
    this.userName = userName;
    this.userInstituteName = userInstituteName;
    this.parentId = parentId;
    this.commentsCount = commentsCount;
    this.upvotes = upvotes;
    this.downvotes = downvotes;
    this.voted = voted;
    this.tags = tags ?? [];
    this.imageUrls = imageUrls ?? [];
  }
}
