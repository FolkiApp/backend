import { Test, TestingModule } from '@nestjs/testing';
import { DeletePostService } from '../services/delete-post.service';
import { PostsRepository } from '../repositories/posts.repository';
import { PostsEntity } from '../entities/posts.entity';
import { NotFoundPostException } from '../exceptions/not-found-posts.exception';
import { UnauthorizedPostException } from '../exceptions/unauthorized-post.exception';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { AuthUser } from '../../common/guards/auth.guard';

describe('DeletePostService', () => {
  let service: DeletePostService;
  let postsRepository: PostsRepository;

  const mockPostsRepository = {
    getPostById: jest.fn(),
    deletePost: jest.fn(),
  };

  const mockAuthUser: AuthUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
  };

  const mockPost = new PostsEntity(
    1,
    new Date('2025-03-10T12:30:00.000Z'),
    'Test Post',
    'Test Content',
    1,
    0,
    undefined,
    ['tag1', 'tag2'],
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletePostService,
        {
          provide: PostsRepository,
          useValue: mockPostsRepository,
        },
      ],
    }).compile();

    service = module.get<DeletePostService>(DeletePostService);
    postsRepository = module.get<PostsRepository>(PostsRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should delete a post successfully when user is the author', async () => {
      mockPostsRepository.getPostById.mockResolvedValue(mockPost);
      mockPostsRepository.deletePost.mockResolvedValue(undefined);

      await service.execute(1, mockAuthUser);

      expect(postsRepository.getPostById).toHaveBeenCalledWith(1);
      expect(postsRepository.deletePost).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundPostException when post does not exist', async () => {
      mockPostsRepository.getPostById.mockResolvedValue(null);

      await expect(service.execute(999, mockAuthUser)).rejects.toThrow(
        NotFoundPostException,
      );

      expect(postsRepository.getPostById).toHaveBeenCalledWith(999);
      expect(postsRepository.deletePost).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedPostException when user is not the author', async () => {
      const differentUser: AuthUser = {
        id: 2,
        email: 'other@example.com',
        username: 'otheruser',
      };

      mockPostsRepository.getPostById.mockResolvedValue(mockPost);

      await expect(service.execute(1, differentUser)).rejects.toThrow(
        UnauthorizedPostException,
      );

      expect(postsRepository.getPostById).toHaveBeenCalledWith(1);
      expect(postsRepository.deletePost).not.toHaveBeenCalled();
    });

    it('should throw PostInternalErrorException when an unexpected error occurs', async () => {
      mockPostsRepository.getPostById.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(1, mockAuthUser)).rejects.toThrow(
        PostInternalErrorException,
      );

      expect(postsRepository.getPostById).toHaveBeenCalledWith(1);
    });

    it('should re-throw NotFoundPostException without wrapping', async () => {
      mockPostsRepository.getPostById.mockResolvedValue(null);

      try {
        await service.execute(1, mockAuthUser);
        fail('Should have thrown an exception');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundPostException);
        const typedError = error as NotFoundPostException;
        expect(typedError.code).toBe('NOT_FOUND_POSTS_EXCEPTION');
      }
    });

    it('should re-throw UnauthorizedPostException without wrapping', async () => {
      const differentUser: AuthUser = {
        id: 2,
        email: 'other@example.com',
        username: 'otheruser',
      };

      mockPostsRepository.getPostById.mockResolvedValue(mockPost);

      try {
        await service.execute(1, differentUser);
        fail('Should have thrown an exception');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedPostException);
        const typedError = error as UnauthorizedPostException;
        expect(typedError.code).toBe('UNAUTHORIZED_POST_EXCEPTION');
      }
    });
  });

  describe('deletePost', () => {
    it('should delete a post when user is authorized', async () => {
      mockPostsRepository.getPostById.mockResolvedValue(mockPost);
      mockPostsRepository.deletePost.mockResolvedValue(undefined);

      await service.deletePost(1, 1);

      expect(postsRepository.getPostById).toHaveBeenCalledWith(1);
      expect(postsRepository.deletePost).toHaveBeenCalledWith(1);
    });

    it('should not call deletePost if post is not found', async () => {
      mockPostsRepository.getPostById.mockResolvedValue(null);

      await expect(service.deletePost(999, 1)).rejects.toThrow(
        NotFoundPostException,
      );

      expect(postsRepository.deletePost).not.toHaveBeenCalled();
    });

    it('should not call deletePost if user is not authorized', async () => {
      mockPostsRepository.getPostById.mockResolvedValue(mockPost);

      await expect(service.deletePost(1, 2)).rejects.toThrow(
        UnauthorizedPostException,
      );

      expect(postsRepository.deletePost).not.toHaveBeenCalled();
    });
  });
});
