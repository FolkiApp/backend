/* id            Int          @id @default(autoincrement())
  date          DateTime
  createdAt     DateTime     @default(now())
  userSubject   user_subject @relation(fields: [userSubjectId], references: [id])
  userId        Int
  userSubjectId Int */

import { UserSubject } from '../../users/entities/user-subject.entity';

export class UserAbsence {
  id: number;
  date: Date;
  createdAt: Date;
  userId: number;
  userSubjectId: number;
  userSubject?: UserSubject;
}
