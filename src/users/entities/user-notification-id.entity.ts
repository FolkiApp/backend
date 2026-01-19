export class UserNotificationId {
  userId: number;
  notificationId: string;
  lastUpdated: Date;

  constructor(partial: Partial<UserNotificationId>) {
    Object.assign(this, partial);
  }
}
