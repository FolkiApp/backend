import { ApiProperty } from '@nestjs/swagger';

export class UniversityResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Universidade de São Paulo' })
  name: string;

  @ApiProperty({ example: 'usp' })
  slug: string;

  constructor(id: number, name: string, slug: string) {
    this.id = id;
    this.name = name;
    this.slug = slug;
  }
}
