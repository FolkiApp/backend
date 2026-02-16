import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiPropertyOptional({
    description:
      'ID de idempotência (UUID v4). Gerado automaticamente se não fornecido.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  idempotencyId?: string;

  @ApiProperty({
    description: 'Título da notificação push',
    example: 'Nova Atividade de Cálculo I',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Corpo da mensagem da notificação',
    example: 'A Atividade "Prova 2" Foi Adicionada para 15 de Março.',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description:
      'IDs dos usuários que receberão a notificação. Os playerIds do OneSignal serão buscados automaticamente.',
    example: [1, 2, 3, 15, 42],
    type: [Number],
    minItems: 1,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  userIds: number[];

  @ApiPropertyOptional({
    description:
      'Dados adicionais para navegação (ex: postId para abrir um post específico)',
    example: { postId: '123', type: 'comment' },
  })
  @IsOptional()
  data?: Record<string, any>;
}
