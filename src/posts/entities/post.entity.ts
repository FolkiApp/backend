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
    public imageUrls: string[] = [],
    public upvotes: number = 0,
    public downvotes: number = 0,
    public voted: 'up' | 'down' | null = null,
  ) {}
}
