export class PostsEntity {
  constructor(
    public id: number,
    public postDate: Date,
    public title: string,
    public content: string,
    public userId: number,
    public parentPostId: number | null,
    public tags?: string[],
    public childPosts?: PostsEntity[],
  ) {}
}
