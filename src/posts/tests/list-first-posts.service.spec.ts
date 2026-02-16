import { Test, TestingModule } from '@nestjs/testing';
import { ListFirstPostService } from '../services/list-first-post.service';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';

describe('ListFirstPostService', () => {
  let service: ListFirstPostService;
  let postsRepository: PostRepository;

  const mockPostsRepository: jest.Mocked<Pick<PostRepository, 'listPosts'>> = {
    listPosts: jest.fn(),
  };

  const mockPosts: Post[] = [
    new Post(
      3,
      new Date('2025-03-12T12:30:00.000Z'),
      'Third Post',
      'Content 3',
      1,
      'Test User',
      null,
      0,
      ['tag3'],
      null,
    ),
    new Post(
      2,
      new Date('2025-03-11T12:30:00.000Z'),
      'Second Post',
      'Content 2',
      1,
      'Test User',
      null,
      5,
      ['tag2'],
      null,
    ),
    new Post(
      1,
      new Date('2025-03-10T12:30:00.000Z'),
      'First Post',
      'Content 1',
      2,
      'Another User',
      null,
      10,
      ['tag1'],
      null,
    ),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListFirstPostService,
        {
          provide: PostRepository,
          useValue: mockPostsRepository,
        },
      ],
    }).compile();

    service = module.get<ListFirstPostService>(ListFirstPostService);
    postsRepository = module.get<PostRepository>(PostRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should list first batch of posts with specified quantity', async () => {
      mockPostsRepository.listPosts.mockResolvedValue(mockPosts);

      const result = await service.execute(10, null);

      expect(result).toEqual(mockPosts);
      expect(postsRepository.listPosts).toHaveBeenCalledWith(
        10,
        null,
        undefined,
      );
    });

    it('should return empty array when no posts exist', async () => {
      mockPostsRepository.listPosts.mockResolvedValue([]);

      const result = await service.execute(10, null);

      expect(result).toEqual([]);
      expect(postsRepository.listPosts).toHaveBeenCalledWith(
        10,
        null,
        undefined,
      );
    });

    it('should throw NotFoundPostException when repository returns null', async () => {
      mockPostsRepository.listPosts.mockResolvedValue(null);

      await expect(service.execute(10, null)).rejects.toThrow(
        NotFoundPostException,
      );
    });

    it('should throw PostInternalErrorException on database error', async () => {
      mockPostsRepository.listPosts.mockRejectedValue(
        new Error('Database error'),
      );

      try {
        await service.execute(10, null);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(PostInternalErrorException);
      }
    });

    it('should use default quantity when not specified', async () => {
      mockPostsRepository.listPosts.mockResolvedValue(mockPosts);

      await service.execute(10, null);

      expect(postsRepository.listPosts).toHaveBeenCalledWith(
        10,
        null,
        undefined,
      );
    });

    it('should handle large quantity values', async () => {
      mockPostsRepository.listPosts.mockResolvedValue(mockPosts);

      await service.execute(1000, null);

      expect(postsRepository.listPosts).toHaveBeenCalledWith(
        1000,
        null,
        undefined,
      );
    });

    it('should handle single post result', async () => {
      const singlePost = [mockPosts[0]];
      mockPostsRepository.listPosts.mockResolvedValue(singlePost);

      const result = await service.execute(1, null);

      expect(result).toEqual(singlePost);
      expect(result.length).toBe(1);
    });
  });

  describe('listFirstPosts', () => {
    it('should list posts with specified quantity', async () => {
      mockPostsRepository.listPosts.mockResolvedValue(mockPosts);

      const result = await service.listFirstPosts(10);

      expect(result).toEqual(mockPosts);
      expect(result.length).toBe(3);
    });

    it('should throw NotFoundPostException when no posts found', async () => {
      mockPostsRepository.listPosts.mockResolvedValue(null);

      await expect(service.listFirstPosts(10)).rejects.toThrow(
        NotFoundPostException,
      );
    });

    it('should throw PostInternalErrorException on error', async () => {
      mockPostsRepository.listPosts.mockRejectedValue(
        new Error('DB Connection failed'),
      );

      await expect(service.listFirstPosts(10)).rejects.toThrow(
        PostInternalErrorException,
      );
    });

    it('should return posts ordered correctly', async () => {
      mockPostsRepository.listPosts.mockResolvedValue(mockPosts);

      const result = await service.listFirstPosts(10);

      expect(result[0].id).toBe(3);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(1);
    });

    it('should preserve post properties', async () => {
      mockPostsRepository.listPosts.mockResolvedValue(mockPosts);

      const result = await service.listFirstPosts(10);

      expect(result[0].title).toBe('Third Post');
      expect(result[0].content).toBe('Content 3');
      expect(result[0].userId).toBe(1);
      expect(result[0].tags).toEqual(['tag3']);
    });

    it('should re-throw NotFoundPostException without wrapping', async () => {
      mockPostsRepository.listPosts.mockResolvedValue(null);

      try {
        await service.listFirstPosts(10);
        fail('Should have thrown an exception');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundPostException);
        if (error instanceof NotFoundPostException) {
          expect(error.code).toBe('NOT_FOUND_POSTS_EXCEPTION');
        }
      }
    });
  });
});
