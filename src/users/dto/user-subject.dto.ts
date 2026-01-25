import { UserAbsence } from '../../absences/entities/absence.entity';

export class UserSubjectDto {
  id: number;
  userId: number;
  subjectClassId: number;
  absences: number;
  grading: number;
  createdAt: Date;
  deletedAt?: Date | null;
  userAbsences?: UserAbsence[];
}
