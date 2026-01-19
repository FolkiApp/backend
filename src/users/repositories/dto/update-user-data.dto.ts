export class UpdateUserData {
  constructor(
    public name?: string,
    public instituteId?: number,
    public courseId?: number,
    public universityId?: number,
    public userVersion?: string,
    public notificationId?: string,
  ) {}
}
