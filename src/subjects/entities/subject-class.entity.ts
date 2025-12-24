export class SubjectClass {
  id: number;
  subjectId: number;
  availableDays: unknown;
  year: number;
  semester: number;
  universityId: number;
  observations: string | null;

  constructor(partial: Partial<SubjectClass>) {
    Object.assign(this, partial);
  }
}
