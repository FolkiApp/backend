export class SubjectClass {
  constructor(
    public id: number,
    public subjectId: number,
    public availableDays: unknown,
    public year: number,
    public semester: number,
    public universityId: number | null,
    public observations: string | null,
  ) {}
}
