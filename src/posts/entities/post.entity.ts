export class Post {
  constructor(
    public id: number,
    public postDate: Date,
    public title: string,
    public content: string,
    public userId: number,
    public userName: string,
    public parentId: number | null,
    public commentsCount: number,
    public tags: string[] = [],
    public universityId: number | null = null,
  ) {}
}
