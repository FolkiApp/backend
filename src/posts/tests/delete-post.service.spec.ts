import { Test, TestingModule } from '@nestjs/testing';
import { DeletePostService } from '../services/delete-post.service';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { UnauthorizedPostException } from '../exceptions/unauthorized-post.exception';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { AuthUser } from '../../common/guards/auth.guard';

describe('DeletePostService', () => {
  let service: DeletePostService;
  let postsRepository: PostRepository;

  const mockPostsRepository: jest.Mocked<
    Pick<PostRepository, 'getPostById' | 'deletePost'>
  > = {
    getPostById: jest.fn(),
    deletePost: jest.fn(),
  };

  const mockAuthUser: AuthUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    isAdmin: false,
    instituteId: null,
    courseId: null,
    universityId: null,
    isBlocked: false,
    userVersion: null,
  };

  const mockPost = new Post(
    1,
    new Date('2025-03-10T12:30:00.000Z'),
    'Test Content',
    1,
    'Test User',
    null,
    null,
    0,
    ['tag1', 'tag2'],
    null,
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletePostService,
        {
          provide: PostRepository,
          useValue: mockPostsRepository,
        },
      ],
    }).compile();

    service = module.get<DeletePostService>(DeletePostService);
    postsRepository = module.get<PostRepository>(PostRepository);

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
        name: 'Other User',
        isAdmin: false,
        instituteId: null,
        courseId: null,
        universityId: null,
        isBlocked: false,
        userVersion: null,
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
        if (error instanceof NotFoundPostException) {
          expect(error.code).toBe('NOT_FOUND_POSTS_EXCEPTION');
        }
      }
    });

    it('should re-throw UnauthorizedPostException without wrapping', async () => {
      const differentUser: AuthUser = {
        id: 2,
        email: 'other@example.com',
        name: 'Other User',
        isAdmin: false,
        instituteId: null,
        courseId: null,
        universityId: null,
        isBlocked: false,
        userVersion: null,
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
});
