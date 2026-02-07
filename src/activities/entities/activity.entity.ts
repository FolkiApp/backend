export class Activity {
  constructor(
    public id: number,
    public name: string,
    public description: string | null,
    public finishDate: Date,
    public createdAt: Date,
    public updatedAt: Date,
    public deletedAt: Date | null,
    public isPrivate: boolean,
    public userId: number,
    public subjectClassId: number,
    public value?: number | null,
    public checked?: boolean,
    public subjectClass?: ActivitySubjectClass,
    public user?: ActivityUser,
    public ignored?: boolean,
  ) {}
}

export class ActivitySubjectClass {
  constructor(
    public id: number,
    public year: number,
    public subject?: ActivitySubjectInfo,
  ) {}
}

export class ActivitySubjectInfo {
  constructor(
    public id: number,
    public name: string,
  ) {}
}

export class ActivityUser {
  constructor(public name: string) {}
}
