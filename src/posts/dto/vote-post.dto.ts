import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt } from 'class-validator';

export class VotePostDto {
  @ApiProperty({
    description: '1 para upvote, 0 para downvote',
    example: 1,
    enum: [0, 1],
  })
  @IsInt()
  @IsIn([0, 1])
  upvote: number;
}
