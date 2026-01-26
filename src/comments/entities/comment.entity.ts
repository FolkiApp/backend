export class CommentEntity {
  constructor(
    public id: number,
    public postId: number,
    public userId: number,
    public content: string,
    public date: Date,
  ) {}
}
