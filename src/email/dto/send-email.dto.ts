import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailDto {
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
    description:
      'IDs dos usuários destinatários. Os emails são obtidos a partir desses IDs.',
    example: [1, 2, 3],
    type: [Number],
    minItems: 1,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  userIds!: number[];

  @ApiProperty({
    description: 'Assunto do email.',
    example: 'Bem-vindo ao Folki',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({
    description: 'Corpo do email em HTML.',
    example: '<h1>Olá!</h1><p>Seja bem-vindo.</p>',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  html!: string;

  @ApiPropertyOptional({
    description:
      'Versão em texto puro do email (fallback para clientes sem HTML). Gerada a partir do HTML se omitida.',
    example: 'Olá! Seja bem-vindo.',
  })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiPropertyOptional({
    description: 'Endereço de resposta (Reply-To).',
    example: 'contato@folki.com.br',
  })
  @IsEmail()
  @IsOptional()
  replyTo?: string;
}
