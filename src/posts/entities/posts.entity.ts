import { CommentEntity } from 'src/comments/entities/comment.entity';

export class PostsEntity {
  constructor(
    public id: number,
    public postDate: Date,
    public title: string,
    public content: string,
    public userId: number,
    public commentsCount: number,
    public comments?: CommentEntity[],
    public tags?: string[],
  ) {}
}
