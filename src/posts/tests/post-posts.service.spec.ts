import { Test, TestingModule } from '@nestjs/testing';
import { PostPostsService } from '../services/post-posts.service';
import { PostsRepository } from '../repositories/posts.repository';
import { PostsEntity } from '../entities/posts.entity';
import { EmptyPostException } from '../exceptions/empty-post.exception';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { AuthUser } from '../../common/guards/auth.guard';

describe('PostPostsService', () => {
  let service: PostPostsService;
  let postsRepository: PostsRepository;

  const mockPostsRepository = {
    createPost: jest.fn(),
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
    null,
    ['tag1', 'tag2'],
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostPostsService,
        {
          provide: PostsRepository,
          useValue: mockPostsRepository,
        },
      ],
    }).compile();

    service = module.get<PostPostsService>(PostPostsService);
    postsRepository = module.get<PostsRepository>(PostsRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should create a post successfully with valid title and content', async () => {
      mockPostsRepository.createPost.mockResolvedValue(mockPost);

      const result = await service.execute(
        'Test Post',
        'Test Content',
        mockAuthUser,
        ['tag1', 'tag2'],
      );

      expect(result).toEqual(mockPost);
      expect(postsRepository.createPost).toHaveBeenCalledWith(
        'Test Post',
        'Test Content',
        1,
        ['tag1', 'tag2'],
        undefined,
      );
    });

    it('should throw EmptyPostException when title is empty', async () => {
      await expect(
        service.execute('', 'Test Content', mockAuthUser, []),
      ).rejects.toThrow(EmptyPostException);

      expect(postsRepository.createPost).not.toHaveBeenCalled();
    });

    it('should throw EmptyPostException when content is empty', async () => {
      await expect(
        service.execute('Test Post', '', mockAuthUser, []),
      ).rejects.toThrow(EmptyPostException);

      expect(postsRepository.createPost).not.toHaveBeenCalled();
    });

    it('should throw EmptyPostException when title is only whitespace', async () => {
      await expect(
        service.execute('   ', 'Test Content', mockAuthUser, []),
      ).rejects.toThrow(EmptyPostException);

      expect(postsRepository.createPost).not.toHaveBeenCalled();
    });

    it('should throw EmptyPostException when content is only whitespace', async () => {
      await expect(
        service.execute('Test Post', '   ', mockAuthUser, []),
      ).rejects.toThrow(EmptyPostException);

      expect(postsRepository.createPost).not.toHaveBeenCalled();
    });

    it('should throw PostInternalErrorException when repository throws unexpected error', async () => {
      mockPostsRepository.createPost.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.execute('Test Post', 'Test Content', mockAuthUser, []),
      ).rejects.toThrow(PostInternalErrorException);
    });

    it('should handle tags in post creation', async () => {
      const tags = ['tag1', 'tag2', 'tag3'];
      mockPostsRepository.createPost.mockResolvedValue(
        new PostsEntity(
          1,
          new Date(),
          'Test Post',
          'Test Content',
          1,
          null,
          tags,
        ),
      );

      const result = await service.execute(
        'Test Post',
        'Test Content',
        mockAuthUser,
        tags,
      );

      expect(result.tags).toEqual(tags);
      expect(postsRepository.createPost).toHaveBeenCalledWith(
        'Test Post',
        'Test Content',
        1,
        tags,
        undefined,
      );
    });

    it('should create post with empty tags array', async () => {
      mockPostsRepository.createPost.mockResolvedValue(mockPost);

      await service.execute('Test Post', 'Test Content', mockAuthUser, []);

      expect(postsRepository.createPost).toHaveBeenCalledWith(
        'Test Post',
        'Test Content',
        1,
        [],
        undefined,
      );
    });

    it('should create post with parentPostId when provided', async () => {
      mockPostsRepository.createPost.mockResolvedValue(
        new PostsEntity(2, new Date(), 'Child Post', 'Child Content', 1, 1, [
          'tag1',
        ]),
      );

      const result = await service.execute(
        'Child Post',
        'Child Content',
        mockAuthUser,
        ['tag1'],
        1,
      );

      expect(result.parentPostId).toBe(1);
      expect(postsRepository.createPost).toHaveBeenCalledWith(
        'Child Post',
        'Child Content',
        1,
        ['tag1'],
        1,
      );
    });
  });

  describe('createPost', () => {
    it('should create post with valid parameters', async () => {
      mockPostsRepository.createPost.mockResolvedValue(mockPost);

      const result = await service.createPost(
        'Test Post',
        'Test Content',
        1,
        ['tag1'],
        undefined,
      );

      expect(result).toEqual(mockPost);
    });

    it('should create post with parentPostId when provided', async () => {
      const childPost = new PostsEntity(
        2,
        new Date(),
        'Child Post',
        'Child Content',
        1,
        1,
        ['tag1'],
      );
      mockPostsRepository.createPost.mockResolvedValue(childPost);

      const result = await service.createPost(
        'Child Post',
        'Child Content',
        1,
        ['tag1'],
        1,
      );

      expect(result).toEqual(childPost);
      expect(result.parentPostId).toBe(1);
    });

    it('should throw EmptyPostException for empty title', async () => {
      await expect(
        service.createPost('', 'Test Content', 1, [], undefined),
      ).rejects.toThrow(EmptyPostException);
    });

    it('should throw EmptyPostException for empty content', async () => {
      await expect(
        service.createPost('Test Post', '', 1, [], undefined),
      ).rejects.toThrow(EmptyPostException);
    });

    it('should throw EmptyPostException for null title', async () => {
      await expect(
        service.createPost(null as any, 'Test Content', 1, [], undefined),
      ).rejects.toThrow(EmptyPostException);
    });

    it('should throw EmptyPostException for null content', async () => {
      await expect(
        service.createPost('Test Post', null as any, 1, [], undefined),
      ).rejects.toThrow(EmptyPostException);
    });

    it('should throw EmptyPostException for undefined title', async () => {
      await expect(
        service.createPost(undefined as any, 'Test Content', 1, [], undefined),
      ).rejects.toThrow(EmptyPostException);
    });

    it('should throw EmptyPostException for undefined content', async () => {
      await expect(
        service.createPost('Test Post', undefined as any, 1, [], undefined),
      ).rejects.toThrow(EmptyPostException);
    });
  });
});
