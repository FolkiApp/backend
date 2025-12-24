export class Institute {
  id: number;
  name: string;
  universityId: number;

  constructor(partial: Partial<Institute>) {
    Object.assign(this, partial);
  }
}
