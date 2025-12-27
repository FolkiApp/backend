export class Subject {
  id: number;
  code: string;
  name: string;
  universityId: number | null;

  constructor(partial: Partial<Subject>) {
    Object.assign(this, partial);
  }
}
