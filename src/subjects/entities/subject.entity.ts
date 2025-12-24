export class Subject {
  id: number;
  code: string;
  name: string;
  universityId: number;

  constructor(partial: Partial<Subject>) {
    Object.assign(this, partial);
  }
}
