import { SubjectClass } from 'src/subjects/entities/subject-class.entity';

export class UserSubject {
  id?: number;
  absences?: number;
  grading?: number;
  subjectClass: SubjectClass;
  observation?: string;
}
