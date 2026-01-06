export class UserActivityIgnore {
  constructor(
    public userId: number,
    public activityId: number,
    public createdAt: Date,
  ) {}
}
