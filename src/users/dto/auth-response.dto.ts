import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  constructor(token: string, user: UserResponseDto) {
    this.token = token;
    this.user = user;
  }
}
