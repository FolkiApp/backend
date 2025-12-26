export enum ImportantDateType {
  DAY_OFF = 'DAY_OFF',
  GENERAL = 'GENERAL',
}

export class importantDate {
  id: number;
  name: string;
  date: Date;
  type: ImportantDateType;
  shouldNotify: boolean;
  campusId: number | null;
  universityId: number | null;
}
