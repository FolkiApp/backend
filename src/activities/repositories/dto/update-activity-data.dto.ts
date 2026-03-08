import { ActivityType } from '../../dto/create-activity.dto';

export class UpdateActivityData {
  constructor(
    public name?: string,
    public description?: string,
    public value?: number | null,
    public type?: ActivityType,
    public finishDate?: Date,
    public isPrivate?: boolean,
    public deletedAt?: Date | null,
  ) {}
}
