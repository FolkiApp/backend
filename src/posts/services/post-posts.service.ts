import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { PostsRepository } from '../repositories/posts.repository';
import { PostsEntity } from '../entities/posts.entity';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { EmptyPostException } from '../exceptions/empty-post.exception';

@Injectable()
export class PostPostsService {
  private readonly logger = new Logger(PostPostsService.name);

  constructor(private readonly postRepository: PostsRepository) {}

  async execute(
    title: string,
    content: string,
    user: AuthUser,
    tags: string[],
    parentPostId?: number,
  ): Promise<PostsEntity> {
    this.logger.log({ message: 'Creating Post', parentPostId });
    return this.createPost(title, content, user.id, tags, parentPostId);
  }
  async createPost(
    title: string,
    content: string,
    userId: number,
    tags: string[],
    parentPostId?: number,
  ): Promise<PostsEntity> {
    try {
      if (!title?.trim() || !content?.trim()) {
        throw new EmptyPostException();
      }
      const post = await this.postRepository.createPost(
        title,
        content,
        userId,
        tags,
        parentPostId,
      );
      return post;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error creating post',
        error: error instanceof Error ? error.message : error,
      });
      if (error instanceof EmptyPostException) {
        throw new EmptyPostException();
      }
      throw new PostInternalErrorException();
    }
  }
}
