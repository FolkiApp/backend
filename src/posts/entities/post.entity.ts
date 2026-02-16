export class Post {
  constructor(
    public id: number,
    public postDate: Date,
    public title: string,
    public content: string,
    public userId: number,
    public parentId: number | null,
    public commentsCount: number,
    public tags?: string[],
  ) {}
}
