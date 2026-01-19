import { ImportantDateType } from '../entities/important-date-type.entity';

export interface CreateImportantDateDataDto {
  name: string;
  date: Date;
  type: ImportantDateType;
  shouldNotify: boolean;
  campusId: number | null;
  universityId: number | null;
}
