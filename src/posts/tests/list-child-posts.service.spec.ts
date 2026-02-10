import { Test, TestingModule } from '@nestjs/testing';
import { ListChildPostsService } from '../services/list-child-posts.service';
import { PostsRepository } from '../repositories/posts.repository';
import { PostsEntity } from '../entities/posts.entity';
import { NotFoundPostException } from '../exceptions/not-found-posts.exception';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';

describe('ListChildPostsService', () => {
  let service: ListChildPostsService;
  let postsRepository: PostsRepository;

  const mockPostsRepository = {
    listChildPosts: jest.fn(),
    listNextChildPosts: jest.fn(),
  };

  const mockChildPosts: PostsEntity[] = [
    new PostsEntity(
      5,
      new Date('2025-03-15T12:30:00.000Z'),
      'Child Post 3',
      'Child Content 3',
      2,
      1,
      ['tag5'],
    ),
    new PostsEntity(
      4,
      new Date('2025-03-14T12:30:00.000Z'),
      'Child Post 2',
      'Child Content 2',
      2,
      1,
      ['tag4'],
    ),
    new PostsEntity(
      3,
      new Date('2025-03-13T12:30:00.000Z'),
      'Child Post 1',
      'Child Content 1',
      1,
      1,
      ['tag3'],
    ),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListChildPostsService,
        {
          provide: PostsRepository,
          useValue: mockPostsRepository,
        },
      ],
    }).compile();

    service = module.get<ListChildPostsService>(ListChildPostsService);
    postsRepository = module.get<PostsRepository>(PostsRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should list first batch of child posts with specified quantity', async () => {
      mockPostsRepository.listChildPosts.mockResolvedValue(mockChildPosts);

      const result = await service.execute(1, 10);

      expect(result).toEqual(mockChildPosts);
      expect(postsRepository.listChildPosts).toHaveBeenCalledWith(1, 10);
    });

    it('should return empty array when no child posts exist', async () => {
      mockPostsRepository.listChildPosts.mockResolvedValue([]);

      const result = await service.execute(1, 10);

      expect(result).toEqual([]);
      expect(postsRepository.listChildPosts).toHaveBeenCalledWith(1, 10);
    });

    it('should throw NotFoundPostException when repository returns null', async () => {
      mockPostsRepository.listChildPosts.mockResolvedValue(null);

      await expect(service.execute(1, 10)).rejects.toThrow(
        NotFoundPostException,
      );
    });

    it('should throw PostInternalErrorException on database error', async () => {
      mockPostsRepository.listChildPosts.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(1, 10)).rejects.toThrow(
        PostInternalErrorException,
      );
    });

    it('should handle different parentPostId values', async () => {
      mockPostsRepository.listChildPosts.mockResolvedValue(mockChildPosts);

      await service.execute(5, 10);

      expect(postsRepository.listChildPosts).toHaveBeenCalledWith(5, 10);
    });

    it('should handle different quantity values', async () => {
      mockPostsRepository.listChildPosts.mockResolvedValue(mockChildPosts);

      await service.execute(1, 20);

      expect(postsRepository.listChildPosts).toHaveBeenCalledWith(1, 20);
    });

    it('should handle single child post result', async () => {
      const singlePost = [mockChildPosts[0]];
      mockPostsRepository.listChildPosts.mockResolvedValue(singlePost);

      const result = await service.execute(1, 1);

      expect(result).toEqual(singlePost);
      expect(result.length).toBe(1);
    });
  });

  describe('listChildPosts', () => {
    it('should list child posts with specified quantity', async () => {
      mockPostsRepository.listChildPosts.mockResolvedValue(mockChildPosts);

      const result = await service.listChildPosts(1, 10);

      expect(result).toEqual(mockChildPosts);
      expect(result.length).toBe(3);
    });

    it('should throw NotFoundPostException when no child posts found', async () => {
      mockPostsRepository.listChildPosts.mockResolvedValue(null);

      await expect(service.listChildPosts(1, 10)).rejects.toThrow(
        NotFoundPostException,
      );
    });

    it('should throw PostInternalErrorException on error', async () => {
      mockPostsRepository.listChildPosts.mockRejectedValue(
        new Error('DB Query failed'),
      );

      await expect(service.listChildPosts(1, 10)).rejects.toThrow(
        PostInternalErrorException,
      );
    });

    it('should return child posts ordered correctly (descending by id)', async () => {
      mockPostsRepository.listChildPosts.mockResolvedValue(mockChildPosts);

      const result = await service.listChildPosts(1, 10);

      expect(result[0].id).toBe(5);
      expect(result[1].id).toBe(4);
      expect(result[2].id).toBe(3);
    });

    it('should preserve child post properties', async () => {
      mockPostsRepository.listChildPosts.mockResolvedValue(mockChildPosts);

      const result = await service.listChildPosts(1, 10);

      expect(result[0].title).toBe('Child Post 3');
      expect(result[0].content).toBe('Child Content 3');
      expect(result[0].parentPostId).toBe(1);
      expect(result[0].tags).toEqual(['tag5']);
    });

    it('should re-throw NotFoundPostException without wrapping', async () => {
      mockPostsRepository.listChildPosts.mockResolvedValue(null);

      try {
        await service.listChildPosts(1, 10);
        fail('Should have thrown an exception');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundPostException);
        expect(error.code).toBe('NOT_FOUND_POSTS_EXCEPTION');
      }
    });
  });

  describe('executeNext', () => {
    it('should list next batch of child posts from lastId', async () => {
      mockPostsRepository.listNextChildPosts.mockResolvedValue(mockChildPosts);

      const result = await service.executeNext(1, 10, 10);

      expect(result).toEqual(mockChildPosts);
      expect(postsRepository.listNextChildPosts).toHaveBeenCalledWith(
        1,
        10,
        10,
      );
    });

    it('should return empty array when no more child posts exist', async () => {
      mockPostsRepository.listNextChildPosts.mockResolvedValue([]);

      const result = await service.executeNext(1, 5, 10);

      expect(result).toEqual([]);
      expect(postsRepository.listNextChildPosts).toHaveBeenCalledWith(1, 5, 10);
    });

    it('should throw NotFoundPostException when repository returns null', async () => {
      mockPostsRepository.listNextChildPosts.mockResolvedValue(null);

      await expect(service.executeNext(1, 10, 10)).rejects.toThrow(
        NotFoundPostException,
      );
    });

    it('should throw PostInternalErrorException on database error', async () => {
      mockPostsRepository.listNextChildPosts.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.executeNext(1, 10, 10)).rejects.toThrow(
        PostInternalErrorException,
      );
    });
  });

  describe('listNextChildPosts', () => {
    it('should list next batch of child posts after lastId', async () => {
      mockPostsRepository.listNextChildPosts.mockResolvedValue(mockChildPosts);

      const result = await service.listNextChildPosts(1, 10, 10);

      expect(result).toEqual(mockChildPosts);
      expect(result.length).toBe(3);
    });

    it('should throw NotFoundPostException when no child posts found', async () => {
      mockPostsRepository.listNextChildPosts.mockResolvedValue(null);

      await expect(service.listNextChildPosts(1, 10, 10)).rejects.toThrow(
        NotFoundPostException,
      );
    });

    it('should throw PostInternalErrorException on error', async () => {
      mockPostsRepository.listNextChildPosts.mockRejectedValue(
        new Error('DB Query failed'),
      );

      await expect(service.listNextChildPosts(1, 10, 10)).rejects.toThrow(
        PostInternalErrorException,
      );
    });

    it('should return child posts ordered correctly (descending by id)', async () => {
      mockPostsRepository.listNextChildPosts.mockResolvedValue(mockChildPosts);

      const result = await service.listNextChildPosts(1, 10, 10);

      expect(result[0].id).toBe(5);
      expect(result[1].id).toBe(4);
      expect(result[2].id).toBe(3);
    });

    it('should preserve child post properties including parentPostId', async () => {
      mockPostsRepository.listNextChildPosts.mockResolvedValue(mockChildPosts);

      const result = await service.listNextChildPosts(1, 10, 10);

      expect(result[0].title).toBe('Child Post 3');
      expect(result[0].content).toBe('Child Content 3');
      expect(result[0].userId).toBe(2);
      expect(result[0].parentPostId).toBe(1);
      expect(result[0].tags).toEqual(['tag5']);
    });

    it('should handle large lastId values', async () => {
      mockPostsRepository.listNextChildPosts.mockResolvedValue(mockChildPosts);

      const result = await service.listNextChildPosts(1, 9999, 10);

      expect(result).toEqual(mockChildPosts);
      expect(postsRepository.listNextChildPosts).toHaveBeenCalledWith(
        1,
        9999,
        10,
      );
    });

    it('should work with quantity of 1', async () => {
      const singlePost = [mockChildPosts[0]];
      mockPostsRepository.listNextChildPosts.mockResolvedValue(singlePost);

      const result = await service.listNextChildPosts(1, 10, 1);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(5);
    });
  });
});
