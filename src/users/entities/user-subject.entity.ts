import { SubjectClass } from '../../subjects/entities/subject-class.entity';

export class UserSubject {
  id?: number;
  absences?: number;
  grading?: number;
  subjectClass: SubjectClass;
  observation?: string;
}
