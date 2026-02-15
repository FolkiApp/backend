import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class MeResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  constructor(user: UserResponseDto) {
    this.user = user;
  }
}
