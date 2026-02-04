import { ApiProperty } from '@nestjs/swagger';

export class CoolNumbersDto {
  @ApiProperty({ example: 8900 })
  numbers: number;
}
