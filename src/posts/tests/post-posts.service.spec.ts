import { Test, TestingModule } from '@nestjs/testing';
import { PostPostService } from '../services/post-post.service';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { EmptyPostException } from '../exceptions/empty-post.exception';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { AuthUser } from '../../common/guards/auth.guard';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';

describe('PostPostService', () => {
  let service: PostPostService;
  let postsRepository: PostRepository;

  const mockPostsRepository: jest.Mocked<
    Pick<PostRepository, 'createPost' | 'getPostById'>
  > = {
    createPost: jest.fn(),
    getPostById: jest.fn(),
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
        PostPostService,
        {
          provide: PostRepository,
          useValue: mockPostsRepository,
        },
      ],
    }).compile();

    service = module.get<PostPostService>(PostPostService);
    postsRepository = module.get<PostRepository>(PostRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should create a post successfully with valid content', async () => {
      mockPostsRepository.createPost.mockResolvedValue(mockPost);
      mockPostsRepository.getPostById.mockResolvedValue(null);

      const result = await service.execute(
        'Test Content',
        mockAuthUser,
        ['tag1', 'tag2'],
        undefined,
      );

      expect(result).toEqual(mockPost);
      expect(postsRepository.createPost).toHaveBeenCalledWith(
        'Test Content',
        1,
        null,
        ['tag1', 'tag2'],
        undefined,
      );
    });

    it('should throw EmptyPostException when content is empty', async () => {
      await expect(
        service.execute('', mockAuthUser, [], undefined),
      ).rejects.toThrow(EmptyPostException);

      expect(postsRepository.createPost).not.toHaveBeenCalled();
    });

    it('should throw EmptyPostException when content is only whitespace', async () => {
      await expect(
        service.execute('   ', mockAuthUser, [], undefined),
      ).rejects.toThrow(EmptyPostException);

      expect(postsRepository.createPost).not.toHaveBeenCalled();
    });

    it('should throw PostInternalErrorException when repository throws unexpected error', async () => {
      mockPostsRepository.createPost.mockRejectedValue(
        new Error('Database error'),
      );
      mockPostsRepository.getPostById.mockResolvedValue(null);

      await expect(
        service.execute('Test Content', mockAuthUser, [], undefined),
      ).rejects.toThrow(PostInternalErrorException);
    });

    it('should handle tags in post creation', async () => {
      const tags = ['tag1', 'tag2', 'tag3'];
      mockPostsRepository.createPost.mockResolvedValue(
        new Post(
          1,
          new Date(),
          'Test Content',
          1,
          'Test User',
          null,
          null,
          0,
          tags,
          null,
        ),
      );
      mockPostsRepository.getPostById.mockResolvedValue(null);

      const result = await service.execute(
        'Test Content',
        mockAuthUser,
        tags,
        undefined,
      );

      expect(result.tags).toEqual(tags);
      expect(postsRepository.createPost).toHaveBeenCalledWith(
        'Test Content',
        1,
        null,
        tags,
        undefined,
      );
    });

    it('should create post with empty tags array', async () => {
      mockPostsRepository.createPost.mockResolvedValue(mockPost);
      mockPostsRepository.getPostById.mockResolvedValue(null);

      await service.execute('Test Content', mockAuthUser, [], undefined);

      expect(postsRepository.createPost).toHaveBeenCalledWith(
        'Test Content',
        1,
        null,
        [],
        undefined,
      );
    });

    it('should create a child post when parentId is provided', async () => {
      mockPostsRepository.getPostById.mockResolvedValue(mockPost);
      mockPostsRepository.createPost.mockResolvedValue(mockPost);

      await service.execute('Child Content', mockAuthUser, [], 10);

      expect(postsRepository.getPostById).toHaveBeenCalledWith(10);
      expect(postsRepository.createPost).toHaveBeenCalledWith(
        'Child Content',
        1,
        null,
        [],
        10,
      );
    });

    it('should throw NotFoundPostException when parent post does not exist', async () => {
      mockPostsRepository.getPostById.mockResolvedValue(null);

      await expect(
        service.execute('Child Content', mockAuthUser, [], 999),
      ).rejects.toThrow(NotFoundPostException);

      expect(postsRepository.createPost).not.toHaveBeenCalled();
    });
  });

  describe('createPost', () => {
    it('should create post with valid parameters', async () => {
      mockPostsRepository.createPost.mockResolvedValue(mockPost);
      mockPostsRepository.getPostById.mockResolvedValue(null);

      const result = await service.createPost(
        'Test Content',
        1,
        null,
        ['tag1'],
        undefined,
      );

      expect(result).toEqual(mockPost);
    });

    it('should throw EmptyPostException for empty content', async () => {
      await expect(
        service.createPost('', 1, null, [], undefined),
      ).rejects.toThrow(EmptyPostException);
    });

    it('should throw EmptyPostException for null content', async () => {
      await expect(
        service.createPost(null as unknown as string, 1, null, [], undefined),
      ).rejects.toThrow(EmptyPostException);
    });

    it('should throw EmptyPostException for undefined content', async () => {
      await expect(
        service.createPost(
          undefined as unknown as string,
          1,
          null,
          [],
          undefined,
        ),
      ).rejects.toThrow(EmptyPostException);
    });
  });
});
