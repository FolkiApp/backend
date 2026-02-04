import { UserAbsence } from 'src/absences/entities/absence.entity';
import { SubjectClass } from 'src/subjects/entities/subject-class.entity';

export class UserSubjectDto {
  id?: number;
  absences?: UserAbsence[];
  grading?: number;
  subjectClass: SubjectClass;

  constructor(
    subjectClass: SubjectClass,
    id?: number,
    absences?: UserAbsence[],
    grading?: number,
  ) {
    this.subjectClass = subjectClass;
    this.id = id;
    this.absences = absences;
    this.grading = grading;
  }
}
