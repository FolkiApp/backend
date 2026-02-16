import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { EmptyPostException } from '../exceptions/empty-post.exception';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';

@Injectable()
export class PostPostService {
  private readonly logger = new Logger(PostPostService.name);

  constructor(private readonly postRepository: PostRepository) {}

  async execute(
    title: string,
    content: string,
    user: AuthUser,
    tags: string[],
    parentId?: number,
  ): Promise<Post> {
    this.logger.log({ message: 'Creating Post' });
    return this.createPost(
      title,
      content,
      user.id,
      user.universityId,
      tags,
      parentId,
    );
  }
  async createPost(
    title: string,
    content: string,
    userId: number,
    universityId: number | null,
    tags: string[],
    parentId?: number,
  ): Promise<Post> {
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
        universityId,
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
