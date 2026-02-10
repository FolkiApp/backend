import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from '../posts.controller';
import { PostPostsService } from '../services/post-posts.service';
import { ListFirstPostsService } from '../services/list-first-posts.service';
import { ListNextPostsService } from '../services/list-next-posts.service';
import { DeletePostService } from '../services/delete-post.service';
import { ListChildPostsService } from '../services/list-child-posts.service';
import { PostsEntity } from '../entities/posts.entity';
import { PostDto } from '../dto/post.dto';
import { CreatePostDto } from '../dto/create-post.dto';
import { AuthUser } from '../../common/guards/auth.guard';
import { NotFoundPostException } from '../exceptions/not-found-posts.exception';
import { UnauthorizedPostException } from '../exceptions/unauthorized-post.exception';

describe('PostController', () => {
  let controller: PostController;
  let createPostService: PostPostsService;
  let listFirstPostsService: ListFirstPostsService;
  let listNextPostsService: ListNextPostsService;
  let deletePostService: DeletePostService;
  let listChildPostsService: ListChildPostsService;

  const mockCreatePostService = {
    execute: jest.fn(),
  };

  const mockListFirstPostsService = {
    execute: jest.fn(),
  };

  const mockListNextPostsService = {
    execute: jest.fn(),
  };

  const mockDeletePostService = {
    execute: jest.fn(),
  };

  const mockListChildPostsService = {
    execute: jest.fn(),
    executeNext: jest.fn(),
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

  const mockPosts = [
    mockPost,
    new PostsEntity(
      2,
      new Date('2025-03-11T12:30:00.000Z'),
      'Test Post 2',
      'Test Content 2',
      2,
      null,
      ['tag3'],
    ),
  ];

  const mockChildPost = new PostsEntity(
    3,
    new Date('2025-03-12T12:30:00.000Z'),
    'Child Post',
    'Child Content',
    2,
    1,
    ['tag4'],
  );

  const mockChildPosts = [
    mockChildPost,
    new PostsEntity(
      4,
      new Date('2025-03-13T12:30:00.000Z'),
      'Child Post 2',
      'Child Content 2',
      1,
      1,
      ['tag5'],
    ),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        {
          provide: PostPostsService,
          useValue: mockCreatePostService,
        },
        {
          provide: ListFirstPostsService,
          useValue: mockListFirstPostsService,
        },
        {
          provide: ListNextPostsService,
          useValue: mockListNextPostsService,
        },
        {
          provide: DeletePostService,
          useValue: mockDeletePostService,
        },
        {
          provide: ListChildPostsService,
          useValue: mockListChildPostsService,
        },
      ],
    }).compile();

    controller = module.get<PostController>(PostController);
    createPostService = module.get<PostPostsService>(PostPostsService);
    listFirstPostsService = module.get<ListFirstPostsService>(
      ListFirstPostsService,
    );
    listNextPostsService =
      module.get<ListNextPostsService>(ListNextPostsService);
    deletePostService = module.get<DeletePostService>(DeletePostService);
    listChildPostsService = module.get<ListChildPostsService>(
      ListChildPostsService,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('postPost', () => {
    it('should create a post successfully', async () => {
      const createPostDto: CreatePostDto = {
        title: 'Test Post',
        content: 'Test Content',
        tags: ['tag1', 'tag2'],
      };

      mockCreatePostService.execute.mockResolvedValue(mockPost);

      const result = await controller.postPost(createPostDto, mockAuthUser);

      expect(result).toBeInstanceOf(PostDto);
      expect(result.id).toBe(1);
      expect(result.title).toBe('Test Post');
      expect(result.content).toBe('Test Content');
      expect(createPostService.execute).toHaveBeenCalledWith(
        'Test Post',
        'Test Content',
        mockAuthUser,
        ['tag1', 'tag2'],
        undefined,
      );
    });

    it('should create a child post with parentPostId', async () => {
      const createPostDto: CreatePostDto = {
        title: 'Child Post',
        content: 'Child Content',
        tags: ['tag1'],
        parentPostId: 1,
      };

      const childPost = new PostsEntity(
        2,
        new Date(),
        'Child Post',
        'Child Content',
        1,
        1,
        ['tag1'],
      );

      mockCreatePostService.execute.mockResolvedValue(childPost);

      const result = await controller.postPost(createPostDto, mockAuthUser);

      expect(result).toBeInstanceOf(PostDto);
      expect(result.parentPostId).toBe(1);
      expect(createPostService.execute).toHaveBeenCalledWith(
        'Child Post',
        'Child Content',
        mockAuthUser,
        ['tag1'],
        1,
      );
    });

    it('should return PostDto with all properties', async () => {
      const createPostDto: CreatePostDto = {
        title: 'Test Post',
        content: 'Test Content',
        tags: ['tag1'],
      };

      mockCreatePostService.execute.mockResolvedValue(mockPost);

      const result = await controller.postPost(createPostDto, mockAuthUser);

      expect(result.id).toBe(mockPost.id);
      expect(result.title).toBe(mockPost.title);
      expect(result.content).toBe(mockPost.content);
      expect(result.userId).toBe(mockPost.userId);
      expect(result.parentPostId).toBe(mockPost.parentPostId);
      expect(result.tags).toEqual(mockPost.tags);
    });
  });

  describe('listFirstPosts', () => {
    it('should list first batch of posts', async () => {
      mockListFirstPostsService.execute.mockResolvedValue(mockPosts);

      const result = await controller.listFirstPosts(10);

      expect(result.posts).toHaveLength(2);
      expect(result.posts[0]).toBeInstanceOf(PostDto);
      expect(result.nextId).toBe(2);
      expect(listFirstPostsService.execute).toHaveBeenCalledWith(10);
    });

    it('should return null nextId when no posts are available', async () => {
      mockListFirstPostsService.execute.mockResolvedValue([]);

      const result = await controller.listFirstPosts(10);

      expect(result.posts).toHaveLength(0);
      expect(result.nextId).toBeNull();
    });

    it('should map posts to PostDto correctly', async () => {
      mockListFirstPostsService.execute.mockResolvedValue(mockPosts);

      const result = await controller.listFirstPosts(10);

      expect(result.posts[0].id).toBe(mockPosts[0].id);
      expect(result.posts[0].title).toBe(mockPosts[0].title);
      expect(result.posts[1].id).toBe(mockPosts[1].id);
      expect(result.posts[1].title).toBe(mockPosts[1].title);
    });
  });

  describe('listNextPosts', () => {
    it('should list next batch of posts', async () => {
      mockListNextPostsService.execute.mockResolvedValue(mockPosts);

      const result = await controller.listNextPosts(1, 10);

      expect(result.posts).toHaveLength(2);
      expect(result.posts[0]).toBeInstanceOf(PostDto);
      expect(result.nextId).toBe(2);
      expect(listNextPostsService.execute).toHaveBeenCalledWith(1, 10);
    });

    it('should return null nextId when no more posts are available', async () => {
      mockListNextPostsService.execute.mockResolvedValue([]);

      const result = await controller.listNextPosts(1, 10);

      expect(result.posts).toHaveLength(0);
      expect(result.nextId).toBeNull();
    });

    it('should convert string parameters to numbers', async () => {
      mockListNextPostsService.execute.mockResolvedValue(mockPosts);

      const result = await controller.listNextPosts('1' as any, '10' as any);

      expect(listNextPostsService.execute).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('deletePost', () => {
    it('should delete a post successfully', async () => {
      mockDeletePostService.execute.mockResolvedValue(undefined);

      const result = await controller.deletePost(1, mockAuthUser);

      expect(result.message).toBe('Post deleted successfully');
      expect(deletePostService.execute).toHaveBeenCalledWith(1, mockAuthUser);
    });

    it('should convert string id parameter to number', async () => {
      mockDeletePostService.execute.mockResolvedValue(undefined);

      await controller.deletePost('1' as any, mockAuthUser);

      expect(deletePostService.execute).toHaveBeenCalledWith(1, mockAuthUser);
    });

    it('should throw NotFoundPostException when post does not exist', async () => {
      mockDeletePostService.execute.mockRejectedValue(
        new NotFoundPostException(),
      );

      await expect(controller.deletePost(999, mockAuthUser)).rejects.toThrow(
        NotFoundPostException,
      );
    });

    it('should throw UnauthorizedPostException when user is not the author', async () => {
      mockDeletePostService.execute.mockRejectedValue(
        new UnauthorizedPostException(),
      );

      const differentUser: AuthUser = {
        id: 2,
        email: 'other@example.com',
        username: 'otheruser',
      };

      await expect(controller.deletePost(1, differentUser)).rejects.toThrow(
        UnauthorizedPostException,
      );
    });

    it('should call deletePostService with correct parameters', async () => {
      mockDeletePostService.execute.mockResolvedValue(undefined);

      await controller.deletePost(5, mockAuthUser);

      expect(deletePostService.execute).toHaveBeenCalledWith(5, mockAuthUser);
      expect(deletePostService.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('listChildPosts', () => {
    it('should list first batch of child posts', async () => {
      mockListChildPostsService.execute.mockResolvedValue(mockChildPosts);

      const result = await controller.listChildPosts(1, 10);

      expect(result.posts).toHaveLength(2);
      expect(result.posts[0]).toBeInstanceOf(PostDto);
      expect(result.nextId).toBe(4);
      expect(listChildPostsService.execute).toHaveBeenCalledWith(1, 10);
    });

    it('should return null nextId when no child posts are available', async () => {
      mockListChildPostsService.execute.mockResolvedValue([]);

      const result = await controller.listChildPosts(1, 10);

      expect(result.posts).toHaveLength(0);
      expect(result.nextId).toBeNull();
    });

    it('should map child posts to PostDto correctly', async () => {
      mockListChildPostsService.execute.mockResolvedValue(mockChildPosts);

      const result = await controller.listChildPosts(1, 10);

      expect(result.posts[0].id).toBe(mockChildPosts[0].id);
      expect(result.posts[0].parentPostId).toBe(1);
      expect(result.posts[1].id).toBe(mockChildPosts[1].id);
      expect(result.posts[1].parentPostId).toBe(1);
    });

    it('should convert string parameters to numbers', async () => {
      mockListChildPostsService.execute.mockResolvedValue(mockChildPosts);

      const result = await controller.listChildPosts('1' as any, '10' as any);

      expect(listChildPostsService.execute).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('listNextChildPosts', () => {
    it('should list next batch of child posts', async () => {
      mockListChildPostsService.executeNext.mockResolvedValue(mockChildPosts);

      const result = await controller.listNextChildPosts(1, 3, 10);

      expect(result.posts).toHaveLength(2);
      expect(result.posts[0]).toBeInstanceOf(PostDto);
      expect(result.nextId).toBe(4);
      expect(listChildPostsService.executeNext).toHaveBeenCalledWith(1, 3, 10);
    });

    it('should return null nextId when no more child posts are available', async () => {
      mockListChildPostsService.executeNext.mockResolvedValue([]);

      const result = await controller.listNextChildPosts(1, 4, 10);

      expect(result.posts).toHaveLength(0);
      expect(result.nextId).toBeNull();
    });

    it('should convert string parameters to numbers', async () => {
      mockListChildPostsService.executeNext.mockResolvedValue(mockChildPosts);

      const result = await controller.listNextChildPosts(
        '1' as any,
        '3' as any,
        '10' as any,
      );

      expect(listChildPostsService.executeNext).toHaveBeenCalledWith(1, 3, 10);
    });

    it('should preserve parentPostId in child posts', async () => {
      mockListChildPostsService.executeNext.mockResolvedValue(mockChildPosts);

      const result = await controller.listNextChildPosts(1, 3, 10);

      expect(result.posts[0].parentPostId).toBe(1);
      expect(result.posts[1].parentPostId).toBe(1);
    });
  });
});
