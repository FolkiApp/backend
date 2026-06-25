import { Test, TestingModule } from '@nestjs/testing';
import { CountNewPostsService } from '../services/count-new-posts.service';
import { PostRepository } from '../repositories/post.repository';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';

describe('CountNewPostsService', () => {
  let service: CountNewPostsService;
  let postsRepository: PostRepository;

  const mockPostsRepository: jest.Mocked<
    Pick<PostRepository, 'countPostsInLast24Hours'>
  > = {
    countPostsInLast24Hours: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountNewPostsService,
        {
          provide: PostRepository,
          useValue: mockPostsRepository,
        },
      ],
    }).compile();

    service = module.get<CountNewPostsService>(CountNewPostsService);
    postsRepository = module.get<PostRepository>(PostRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should count posts successfully with a university ID', async () => {
      mockPostsRepository.countPostsInLast24Hours.mockResolvedValue(5);

      const result = await service.execute(1);

      expect(result).toBe(5);
      expect(postsRepository.countPostsInLast24Hours).toHaveBeenCalledWith(1);
    });

    it('should count posts successfully with null university ID', async () => {
      mockPostsRepository.countPostsInLast24Hours.mockResolvedValue(10);

      const result = await service.execute(null);

      expect(result).toBe(10);
      expect(postsRepository.countPostsInLast24Hours).toHaveBeenCalledWith(
        null,
      );
    });

    it('should throw PostInternalErrorException when repository throws an error', async () => {
      mockPostsRepository.countPostsInLast24Hours.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(1)).rejects.toThrow(
        PostInternalErrorException,
      );

      expect(postsRepository.countPostsInLast24Hours).toHaveBeenCalledWith(1);
    });
  });
});
