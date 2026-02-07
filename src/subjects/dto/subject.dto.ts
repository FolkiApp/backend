import { ApiProperty } from '@nestjs/swagger';

export class SubjectDto {
  @ApiProperty({ example: 1, description: 'ID da disciplina' })
  id: number;

  @ApiProperty({ example: 'Cálculo I', description: 'Nome da disciplina' })
  name: string;

  @ApiProperty({
    example: 'MAT001',
    description: 'Código da disciplina',
    required: false,
  })
  code?: string;

  @ApiProperty({
    example: 'Limites, derivadas e integrais',
    description: 'Conteúdo da disciplina',
    required: false,
  })
  content?: string;

  @ApiProperty({
    example: 10,
    description: 'Número de itens no drive',
    required: false,
  })
  driveItemsNumber?: number;

  constructor(
    id: number,
    name: string,
    code?: string,
    content?: string,
    driveItemsNumber?: number,
  ) {
    this.id = id;
    this.name = name;
    this.code = code;
    this.content = content;
    this.driveItemsNumber = driveItemsNumber;
  }
}
