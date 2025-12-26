import { ImportDateType } from '@prisma/client';

export class importantDates {
  id: number;
  name: string;
  date: Date;
  type: ImportDateType;
  shouldNotify: boolean;
  campusId: number | null;
  universityId: number | null;
}
