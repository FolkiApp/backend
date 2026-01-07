import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsNumber, Min, Max } from 'class-validator';

export class CreateGradeDto {
  @ApiProperty({
    description: 'ID da matéria do usuário',
    example: 1,
  })
  @IsInt()
  userSubjectId: number;

  @ApiProperty({
    description: 'Nome da nota',
    example: 'Prova 1',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Porcentagem da nota na média final',
    example: 30,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiProperty({
    description: 'Valor da nota',
    example: 8.5,
    minimum: 0,
    maximum: 10,
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  value: number;
}
