export class Course {
  id: number;
  name: string;
  universityId: number;

  constructor(partial: Partial<Course>) {
    Object.assign(this, partial);
  }
}
