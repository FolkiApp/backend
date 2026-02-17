export class Post {
  constructor(
    public id: number,
    public postDate: Date,
    public content: string,
    public userId: number,
    public userName: string,
    public userInstituteName: string | null,
    public parentId: number | null,
    public commentsCount: number,
    public tags: string[] = [],
    public universityId: number | null = null,
  ) {}
}
