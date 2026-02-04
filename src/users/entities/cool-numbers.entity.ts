import { ApiProperty } from '@nestjs/swagger';

export class CoolNumbersEntity {
  @ApiProperty({ example: 8900 })
  numbers: number;

  constructor(numbers: number) {
    this.numbers = numbers;
  }
}
