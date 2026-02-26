import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { VotePostService } from './vote-post.service';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { AuthUser } from '../../common/guards/auth.guard';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';

describe('VotePostService', () => {
  let service: VotePostService;
  let postRepository: jest.Mocked<PostRepository>;

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
    ['tag1'],
    null,
    [],
    5,
    2,
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotePostService,
        {
          provide: PostRepository,
          useValue: {
            getPostById: jest.fn(),
            vote_post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VotePostService>(VotePostService);
    postRepository = module.get(PostRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should register an upvote when upvote value is 1', async () => {
      postRepository.getPostById.mockResolvedValue(mockPost);
      postRepository.vote_post.mockResolvedValue(true);

      const result = await service.execute(1, mockAuthUser, 1);

      expect(result).toBe(true);
      expect(postRepository.getPostById).toHaveBeenCalledWith(1);
      expect(postRepository.vote_post).toHaveBeenCalledWith(1, 1, true, false);
    });

    it('should register a downvote when upvote value is 0', async () => {
      postRepository.getPostById.mockResolvedValue(mockPost);
      postRepository.vote_post.mockResolvedValue(true);

      const result = await service.execute(1, mockAuthUser, 0);

      expect(result).toBe(true);
      expect(postRepository.getPostById).toHaveBeenCalledWith(1);
      expect(postRepository.vote_post).toHaveBeenCalledWith(1, 1, false, true);
    });

    it('should throw BadRequestException when vote value is invalid', async () => {
      await expect(service.execute(1, mockAuthUser, 2)).rejects.toThrow(
        BadRequestException,
      );

      expect(postRepository.getPostById).not.toHaveBeenCalled();
      expect(postRepository.vote_post).not.toHaveBeenCalled();
    });

    it('should throw NotFoundPostException when post does not exist', async () => {
      postRepository.getPostById.mockResolvedValue(null);

      await expect(service.execute(999, mockAuthUser, 1)).rejects.toThrow(
        NotFoundPostException,
      );

      expect(postRepository.getPostById).toHaveBeenCalledWith(999);
      expect(postRepository.vote_post).not.toHaveBeenCalled();
    });

    it('should throw PostInternalErrorException when repository fails', async () => {
      postRepository.getPostById.mockRejectedValue(new Error('Database error'));

      await expect(service.execute(1, mockAuthUser, 1)).rejects.toThrow(
        PostInternalErrorException,
      );

      expect(postRepository.getPostById).toHaveBeenCalledWith(1);
    });
  });
});
