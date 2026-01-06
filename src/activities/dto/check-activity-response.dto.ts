import { ApiProperty } from '@nestjs/swagger';

export class CheckActivityResponseDto {
  @ApiProperty({
    description: 'ID do registro de check',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID do usuário',
    example: 1,
  })
  userId: number;

  @ApiProperty({
    description: 'ID da atividade',
    example: 1,
  })
  activityId: number;

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-12-31T15:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-12-31T15:00:00.000Z',
  })
  updatedAt: Date;
}
