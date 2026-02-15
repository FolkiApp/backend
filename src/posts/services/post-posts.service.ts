import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { PostsRepository } from '../repositories/posts.repository';
import { Posts } from '../entities/posts.entity';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { EmptyPostException } from '../exceptions/empty-post.exception';
import { NotFoundPostException } from '../exceptions/not-found-posts.exception';

@Injectable()
export class PostPostsService {
  private readonly logger = new Logger(PostPostsService.name);

  constructor(private readonly postRepository: PostsRepository) {}

  async execute(
    title: string,
    content: string,
    user: AuthUser,
    tags: string[],
    parentId?: number,
  ): Promise<Posts> {
    this.logger.log({ message: 'Creating Post' });
    return this.createPost(title, content, user.id, tags, parentId);
  }
  async createPost(
    title: string,
    content: string,
    userId: number,
    tags: string[],
    parentId?: number,
  ): Promise<Posts> {
    if (!title?.trim() || !content?.trim()) {
      throw new EmptyPostException();
    }
    try {
      if (parentId) {
        const parent = await this.postRepository.getPostById(parentId);
        if (!parent) {
          throw new NotFoundPostException();
        }
      }
      const post = await this.postRepository.createPost(
        title,
        content,
        userId,
        tags,
        parentId,
      );
      return post;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error creating post',
        error: error instanceof Error ? error.message : error,
      });
      if (error instanceof NotFoundPostException) {
        throw error;
      }
      throw new PostInternalErrorException();
    }
  }
}
