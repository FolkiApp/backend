import { UserAbsence } from 'src/absences/entities/absence.entity';
import { SubjectClass } from 'src/subjects/entities/subject-class.entity';

export class UserSubject {
  id?: number;
  absences?: number;
  grading?: number;
  subjectClass: SubjectClass;
  userAbsences?: UserAbsence[];
  observation?: string;
}
