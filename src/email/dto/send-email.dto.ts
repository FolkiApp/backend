import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({
    description: 'Destinatários do email.',
    example: ['aluno@dac.unicamp.br'],
    type: [String],
    minItems: 1,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  to: string[];

  @ApiProperty({
    description: 'Assunto do email.',
    example: 'Bem-vindo ao Folki',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Corpo do email em HTML.',
    example: '<h1>Olá!</h1><p>Seja bem-vindo.</p>',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  html: string;

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
