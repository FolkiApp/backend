import { ApiProperty } from '@nestjs/swagger';
import { ActivityResponseDto } from './activity-response.dto';

export class ActivitiesResponseDto {
  @ApiProperty({ type: [ActivityResponseDto] })
  activities: ActivityResponseDto[];

  constructor(activities: ActivityResponseDto[]) {
    this.activities = activities;
  }
}
