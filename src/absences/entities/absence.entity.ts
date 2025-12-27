import { UserSubject } from '../../users/entities/user-subject.entity';

export class UserAbsence {
  constructor(
    public id: number,
    public date: Date,
    public createdAt: Date,
    public userId: number,
    public userSubjectId: number,
    public userSubject?: UserSubject,
  ) {}
}
