import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { VotePostService } from './vote-post.service';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { AuthUser } from '../../common/guards/auth.guard';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { NotificationQueueService } from '../../notifications/services/notification-queue.service';

describe('VotePostService', () => {
  let service: VotePostService;
  let postRepository: jest.Mocked<PostRepository>;
  let notificationQueueService: jest.Mocked<NotificationQueueService>;

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
    institute: null,
    university: null,
  };

  const mockPost = new Post(
    1,
    new Date('2025-03-10T12:30:00.000Z'),
    'Test Content',
    2,
    'Post Owner',
    null,
    null,
    0,
    ['tag1'],
    null,
    [],
    5,
    2,
    null,
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotePostService,
        {
          provide: PostRepository,
          useValue: {
            getPostById: jest.fn(),
            votePost: jest.fn(),
          },
        },
        {
          provide: NotificationQueueService,
          useValue: {
            addNotificationJob: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VotePostService>(VotePostService);
    postRepository = module.get(PostRepository);
    notificationQueueService = module.get(NotificationQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should register an upvote when upvote value is 1', async () => {
      postRepository.getPostById.mockResolvedValue(mockPost);
      postRepository.votePost.mockResolvedValue(true);

      const result = await service.execute(1, mockAuthUser, 1);

      expect(result).toBe(true);
      expect(postRepository.getPostById).toHaveBeenCalledWith(1);
      expect(postRepository.votePost).toHaveBeenCalledWith(1, 1, true);
    });

    it('should register a downvote when upvote value is 0', async () => {
      postRepository.getPostById.mockResolvedValue(mockPost);
      postRepository.votePost.mockResolvedValue(true);

      const result = await service.execute(1, mockAuthUser, 0);

      expect(result).toBe(true);
      expect(postRepository.getPostById).toHaveBeenCalledWith(1);
      expect(postRepository.votePost).toHaveBeenCalledWith(1, 1, false);
    });

    it('should throw BadRequestException when vote value is invalid', async () => {
      await expect(service.execute(1, mockAuthUser, 2)).rejects.toThrow(
        BadRequestException,
      );

      expect(postRepository.getPostById).not.toHaveBeenCalled();
      expect(postRepository.votePost).not.toHaveBeenCalled();
    });

    it('should throw NotFoundPostException when post does not exist', async () => {
      postRepository.getPostById.mockResolvedValue(null);

      await expect(service.execute(999, mockAuthUser, 1)).rejects.toThrow(
        NotFoundPostException,
      );

      expect(postRepository.getPostById).toHaveBeenCalledWith(999);
      expect(postRepository.votePost).not.toHaveBeenCalled();
    });

    it('should throw PostInternalErrorException when repository fails', async () => {
      postRepository.getPostById.mockRejectedValue(new Error('Database error'));

      await expect(service.execute(1, mockAuthUser, 1)).rejects.toThrow(
        PostInternalErrorException,
      );

      expect(postRepository.getPostById).toHaveBeenCalledWith(1);
    });

    it('should send notification when post reaches 6 upvotes milestone', async () => {
      postRepository.getPostById.mockResolvedValue(mockPost);
      postRepository.votePost.mockResolvedValue(true);

      await service.execute(1, mockAuthUser, 1);

      expect(notificationQueueService.addNotificationJob).toHaveBeenCalledWith({
        title: '5 upvotes!',
        message: 'Sua publicação atingiu 5 upvotes',
        userIds: [2],
        webUrl: 'https://web.folki.com.br/#/Board?postId=1',
        appUrl: 'folki://Board?postId=1',
      });
    });

    it('should not send notification when voter is post owner', async () => {
      const ownPost = new Post(
        1,
        new Date(),
        'Test',
        1,
        'Test User',
        null,
        null,
        0,
        [],
        null,
        [],
        5,
        0,
        null,
      );

      postRepository.getPostById.mockResolvedValue(ownPost);
      postRepository.votePost.mockResolvedValue(true);

      await service.execute(1, mockAuthUser, 1);

      expect(
        notificationQueueService.addNotificationJob,
      ).not.toHaveBeenCalled();
    });

    it('should not send notification for first milestone (2) if it is a comment', async () => {
      const comment = new Post(
        2,
        new Date(),
        'Comment',
        2,
        'Post Owner',
        null,
        1,
        0,
        [],
        null,
        [],
        1,
        0,
        null,
      );

      postRepository.getPostById.mockResolvedValue(comment);
      postRepository.votePost.mockResolvedValue(true);

      await service.execute(2, mockAuthUser, 1);

      expect(
        notificationQueueService.addNotificationJob,
      ).not.toHaveBeenCalled();
    });

    it('should send notification with parent postId for comments', async () => {
      const comment = new Post(
        2,
        new Date(),
        'Comment',
        2,
        'Post Owner',
        null,
        1,
        0,
        [],
        null,
        [],
        5,
        0,
        null,
      );

      postRepository.getPostById.mockResolvedValue(comment);
      postRepository.votePost.mockResolvedValue(true);

      await service.execute(2, mockAuthUser, 1);

      expect(notificationQueueService.addNotificationJob).toHaveBeenCalledWith({
        title: '5 upvotes!',
        message: 'Seu comentário atingiu 5 upvotes',
        userIds: [2],
        webUrl: 'https://web.folki.com.br/#/Board?postId=1',
        appUrl: 'folki://Board?postId=1',
      });
    });

    it('should not send notification when downvoting', async () => {
      postRepository.getPostById.mockResolvedValue(mockPost);
      postRepository.votePost.mockResolvedValue(true);

      await service.execute(1, mockAuthUser, 0);

      expect(
        notificationQueueService.addNotificationJob,
      ).not.toHaveBeenCalled();
    });

    it('should send notification for post at milestone 2', async () => {
      const postAtOne = new Post(
        1,
        new Date(),
        'Test',
        2,
        'Post Owner',
        null,
        null,
        0,
        [],
        null,
        [],
        1,
        0,
        null,
      );

      postRepository.getPostById.mockResolvedValue(postAtOne);
      postRepository.votePost.mockResolvedValue(true);

      await service.execute(1, mockAuthUser, 1);

      expect(notificationQueueService.addNotificationJob).toHaveBeenCalledWith({
        title: '1 upvotes!',
        message: 'Sua publicação atingiu 1 upvotes',
        userIds: [2],
        webUrl: 'https://web.folki.com.br/#/Board?postId=1',
        appUrl: 'folki://Board?postId=1',
      });
    });

    it('should send notification for post at milestone 11', async () => {
      const postAtTen = new Post(
        1,
        new Date(),
        'Test',
        2,
        'Post Owner',
        null,
        null,
        0,
        [],
        null,
        [],
        10,
        0,
        null,
      );

      postRepository.getPostById.mockResolvedValue(postAtTen);
      postRepository.votePost.mockResolvedValue(true);

      await service.execute(1, mockAuthUser, 1);

      expect(notificationQueueService.addNotificationJob).toHaveBeenCalledWith({
        title: '10 upvotes!',
        message: 'Sua publicação atingiu 10 upvotes',
        userIds: [2],
        webUrl: 'https://web.folki.com.br/#/Board?postId=1',
        appUrl: 'folki://Board?postId=1',
      });
    });

    it('should not send notification if milestone was already crossed', async () => {
      const postAtSeven = new Post(
        1,
        new Date(),
        'Test',
        2,
        'Post Owner',
        null,
        null,
        0,
        [],
        null,
        [],
        7,
        0,
        null,
      );

      postRepository.getPostById.mockResolvedValue(postAtSeven);
      postRepository.votePost.mockResolvedValue(true);

      await service.execute(1, mockAuthUser, 1);

      expect(
        notificationQueueService.addNotificationJob,
      ).not.toHaveBeenCalled();
    });
  });
});
