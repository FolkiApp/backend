import { AvailableDay } from './available-days.entity';
import { Subject } from './subject.entity';

export class SubjectClass {
  constructor(
    public id: number,
    public availableDays: AvailableDay[],
    public subject: Subject,
    public observations?: string,
  ) {}
}
