import { Test, TestingModule } from '@nestjs/testing';
import { GetPostByIdService } from './get-post-by-id.service';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';

describe('GetPostByIdService', () => {
  let service: GetPostByIdService;
  let postRepository: jest.Mocked<PostRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPostByIdService,
        {
          provide: PostRepository,
          useValue: {
            getPostById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GetPostByIdService>(GetPostByIdService);
    postRepository = module.get(PostRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should return a post when found', async () => {
      const mockPost = new Post(
        1,
        new Date(),
        'Test content',
        123,
        'João Silva',
        null,
        5,
        ['tag1', 'tag2'],
        1,
      );

      postRepository.getPostById.mockResolvedValue(mockPost);

      const result = await service.execute(1);

      expect(result).toEqual(mockPost);
      expect(postRepository.getPostById).toHaveBeenCalledWith(1);
      expect(postRepository.getPostById).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundPostException when post is not found', async () => {
      postRepository.getPostById.mockResolvedValue(null);

      await expect(service.execute(999)).rejects.toThrow(NotFoundPostException);
      expect(postRepository.getPostById).toHaveBeenCalledWith(999);
    });

    it('should throw PostInternalErrorException when repository throws an error', async () => {
      postRepository.getPostById.mockRejectedValue(new Error('Database error'));

      await expect(service.execute(1)).rejects.toThrow(
        PostInternalErrorException,
      );
      expect(postRepository.getPostById).toHaveBeenCalledWith(1);
    });

    it('should rethrow NotFoundPostException when repository throws it', async () => {
      postRepository.getPostById.mockRejectedValue(new NotFoundPostException());

      await expect(service.execute(1)).rejects.toThrow(NotFoundPostException);
      expect(postRepository.getPostById).toHaveBeenCalledWith(1);
    });
  });
});
