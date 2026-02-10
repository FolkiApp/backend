import { Test, TestingModule } from '@nestjs/testing';
import { ListNextPostsService } from '../services/list-next-posts.service';
import { PostsRepository } from '../repositories/posts.repository';
import { PostsEntity } from '../entities/posts.entity';
import { NotFoundPostException } from '../exceptions/not-found-posts.exception';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';

describe('ListNextPostsService', () => {
  let service: ListNextPostsService;
  let postsRepository: PostsRepository;

  const mockPostsRepository = {
    listNextPosts: jest.fn(),
  };

  const mockPosts: PostsEntity[] = [
    new PostsEntity(
      9,
      new Date('2025-03-18T12:30:00.000Z'),
      'Ninth Post',
      'Content 9',
      1,
      null,
      0,
      ['tag9'],
    ),
    new PostsEntity(
      8,
      new Date('2025-03-17T12:30:00.000Z'),
      'Eighth Post',
      'Content 8',
      2,
      null,
      3,
      ['tag8'],
    ),
    new PostsEntity(
      7,
      new Date('2025-03-16T12:30:00.000Z'),
      'Seventh Post',
      'Content 7',
      3,
      null,
      5,
      ['tag7'],
    ),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListNextPostsService,
        {
          provide: PostsRepository,
          useValue: mockPostsRepository,
        },
      ],
    }).compile();

    service = module.get<ListNextPostsService>(ListNextPostsService);
    postsRepository = module.get<PostsRepository>(PostsRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should list next batch of posts from lastId with specified quantity', async () => {
      mockPostsRepository.listNextPosts.mockResolvedValue(mockPosts);

      const result = await service.execute(10, 10);

      expect(result).toEqual(mockPosts);
      expect(postsRepository.listNextPosts).toHaveBeenCalledWith(10, 10);
    });

    it('should return empty array when no more posts exist', async () => {
      mockPostsRepository.listNextPosts.mockResolvedValue([]);

      const result = await service.execute(5, 10);

      expect(result).toEqual([]);
      expect(postsRepository.listNextPosts).toHaveBeenCalledWith(5, 10);
    });

    it('should throw NotFoundPostException when repository returns null', async () => {
      mockPostsRepository.listNextPosts.mockResolvedValue(null);

      await expect(service.execute(10, 10)).rejects.toThrow(
        NotFoundPostException,
      );
    });

    it('should throw PostInternalErrorException on database error', async () => {
      mockPostsRepository.listNextPosts.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.execute(10, 10)).rejects.toThrow(
        PostInternalErrorException,
      );
    });

    it('should handle different lastId values', async () => {
      mockPostsRepository.listNextPosts.mockResolvedValue(mockPosts);

      await service.execute(5, 10);

      expect(postsRepository.listNextPosts).toHaveBeenCalledWith(5, 10);
    });

    it('should handle different quantity values', async () => {
      mockPostsRepository.listNextPosts.mockResolvedValue(mockPosts);

      await service.execute(10, 20);

      expect(postsRepository.listNextPosts).toHaveBeenCalledWith(10, 20);
    });

    it('should handle single post result', async () => {
      const singlePost = [mockPosts[0]];
      mockPostsRepository.listNextPosts.mockResolvedValue(singlePost);

      const result = await service.execute(10, 1);

      expect(result).toEqual(singlePost);
      expect(result.length).toBe(1);
    });

    it('should handle lastId of 1', async () => {
      mockPostsRepository.listNextPosts.mockResolvedValue(mockPosts);

      await service.execute(1, 10);

      expect(postsRepository.listNextPosts).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('listNextPosts', () => {
    it('should list posts after lastId with specified quantity', async () => {
      mockPostsRepository.listNextPosts.mockResolvedValue(mockPosts);

      const result = await service.listNextPosts(10, 10);

      expect(result).toEqual(mockPosts);
      expect(result.length).toBe(3);
    });

    it('should throw NotFoundPostException when no posts found', async () => {
      mockPostsRepository.listNextPosts.mockResolvedValue(null);

      await expect(service.listNextPosts(10, 10)).rejects.toThrow(
        NotFoundPostException,
      );
    });

    it('should throw PostInternalErrorException on error', async () => {
      mockPostsRepository.listNextPosts.mockRejectedValue(
        new Error('DB Query failed'),
      );

      await expect(service.listNextPosts(10, 10)).rejects.toThrow(
        PostInternalErrorException,
      );
    });

    it('should return posts ordered correctly (descending by id)', async () => {
      mockPostsRepository.listNextPosts.mockResolvedValue(mockPosts);

      const result = await service.listNextPosts(10, 10);

      expect(result[0].id).toBe(9);
      expect(result[1].id).toBe(8);
      expect(result[2].id).toBe(7);
    });

    it('should preserve post properties', async () => {
      mockPostsRepository.listNextPosts.mockResolvedValue(mockPosts);

      const result = await service.listNextPosts(10, 10);

      expect(result[0].title).toBe('Ninth Post');
      expect(result[0].content).toBe('Content 9');
      expect(result[0].userId).toBe(1);
      expect(result[0].commentsCount).toBe(0);
      expect(result[0].tags).toEqual(['tag9']);
    });

    it('should re-throw NotFoundPostException without wrapping', async () => {
      mockPostsRepository.listNextPosts.mockResolvedValue(null);

      try {
        await service.listNextPosts(10, 10);
        fail('Should have thrown an exception');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundPostException);
        const typedError = error as NotFoundPostException;
        expect(typedError.code).toBe('NOT_FOUND_POSTS_EXCEPTION');
      }
    });

    it('should work with large lastId values', async () => {
      mockPostsRepository.listNextPosts.mockResolvedValue(mockPosts);

      const result = await service.listNextPosts(9999, 10);

      expect(result).toEqual(mockPosts);
      expect(postsRepository.listNextPosts).toHaveBeenCalledWith(9999, 10);
    });

    it('should work with quantity of 1', async () => {
      const singlePost = [mockPosts[0]];
      mockPostsRepository.listNextPosts.mockResolvedValue(singlePost);

      const result = await service.listNextPosts(10, 1);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(9);
    });
  });
});
