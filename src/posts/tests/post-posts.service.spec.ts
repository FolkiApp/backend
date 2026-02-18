import { Test, TestingModule } from '@nestjs/testing';
import { PostPostService } from '../services/post-post.service';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { EmptyPostException } from '../exceptions/empty-post.exception';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { AuthUser } from '../../common/guards/auth.guard';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { InappropriateContentException } from '../exceptions/inappropriate-content.exception';
import { ModerationService } from '../services/moderation.service';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('PostPostService', () => {
  let service: PostPostService;
  let postsRepository: PostRepository;

  const mockPostsRepository: jest.Mocked<
    Pick<PostRepository, 'createPost' | 'getPostById'>
  > = {
    createPost: jest.fn(),
    getPostById: jest.fn(),
  };

  const mockModerationService: jest.Mocked<
    Pick<ModerationService, 'moderateContent'>
  > = {
    moderateContent: jest.fn(),
  };

  const mockCustomLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
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
        {
          provide: ModerationService,
          useValue: mockModerationService,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    service = module.get<PostPostService>(PostPostService);
    postsRepository = module.get<PostRepository>(PostRepository);
    // moderationService = module.get<ModerationService>(ModerationService);

    jest.clearAllMocks();

    // Default: moderation passes
    mockModerationService.moderateContent.mockResolvedValue({
      flagged: false,
      categories: {},
    });
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

  describe('moderation and validation', () => {
    it('should throw InappropriateContentException when content is flagged by moderation', async () => {
      mockModerationService.moderateContent.mockResolvedValue({
        flagged: true,
        categories: {
          hate: true,
        },
      });

      await expect(
        service.execute('Inappropriate content', mockAuthUser, [], undefined),
      ).rejects.toThrow(InappropriateContentException);

      expect(mockModerationService.moderateContent).toHaveBeenCalledWith(
        'Inappropriate content',
      );
      expect(postsRepository.createPost).not.toHaveBeenCalled();
    });

    it('should allow post creation when moderation passes', async () => {
      mockModerationService.moderateContent.mockResolvedValue({
        flagged: false,
        categories: {},
      });
      mockPostsRepository.createPost.mockResolvedValue(mockPost);
      mockPostsRepository.getPostById.mockResolvedValue(null);

      const result = await service.execute(
        'Safe content',
        mockAuthUser,
        [],
        undefined,
      );

      expect(mockModerationService.moderateContent).toHaveBeenCalledWith(
        'Safe content',
      );
      expect(result).toEqual(mockPost);
      expect(postsRepository.createPost).toHaveBeenCalled();
    });
  });
});
