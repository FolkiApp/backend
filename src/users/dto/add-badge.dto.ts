import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class AddBadgeDto {
  @ApiPropertyOptional({
    example: '🎓',
    description: 'Badge emoji ou null para remover',
  })
  @IsOptional()
  @IsString()
  badge?: string | null;
}
