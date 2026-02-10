import { ApiProperty } from '@nestjs/swagger';
import { ActivityResponseDto } from './activity-response.dto';

export class CreateActivityResponseDto {
  @ApiProperty({ type: ActivityResponseDto })
  activity: ActivityResponseDto;

  constructor(activity: ActivityResponseDto) {
    this.activity = activity;
  }
}
