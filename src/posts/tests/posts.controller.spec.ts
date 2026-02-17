import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from '../posts.controller';
import { PostPostService } from '../services/post-post.service';
import { ListFirstPostService } from '../services/list-first-post.service';
import { DeletePostService } from '../services/delete-post.service';
import { ListPostChildrenService } from '../services/list-post-children.service';
import { GetPostByIdService } from '../services/get-post-by-id.service';
import { Post } from '../entities/post.entity';
import { PostDto } from '../dto/post.dto';
import { CreatePostDto } from '../dto/create-post.dto';
import { AuthUser } from '../../common/guards/auth.guard';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { UnauthorizedPostException } from '../exceptions/unauthorized-post.exception';

describe('PostsController', () => {
  let controller: PostsController;
  let createPostService: PostPostService;
  let listFirstPostsService: ListFirstPostService;
  let deletePostService: DeletePostService;
  let listPostChildrenService: ListPostChildrenService;

  const mockCreatePostService: jest.Mocked<Pick<PostPostService, 'execute'>> = {
    execute: jest.fn(),
  };

  const mockListFirstPostsService: jest.Mocked<
    Pick<ListFirstPostService, 'execute'>
  > = {
    execute: jest.fn(),
  };

  const mockDeletePostService: jest.Mocked<Pick<DeletePostService, 'execute'>> =
    {
      execute: jest.fn(),
    };

  const mockListPostChildrenService: jest.Mocked<
    Pick<ListPostChildrenService, 'execute'>
  > = {
    execute: jest.fn(),
  };

  const mockGetPostByIdService: jest.Mocked<
    Pick<GetPostByIdService, 'execute'>
  > = {
    execute: jest.fn(),
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

  const mockPosts = [
    mockPost,
    new Post(
      2,
      new Date('2025-03-11T12:30:00.000Z'),
      'Test Content 2',
      2,
      'Another User',
      null,
      null,
      5,
      ['tag3'],
      null,
    ),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostPostService,
          useValue: mockCreatePostService,
        },
        {
          provide: ListFirstPostService,
          useValue: mockListFirstPostsService,
        },
        {
          provide: DeletePostService,
          useValue: mockDeletePostService,
        },
        {
          provide: ListPostChildrenService,
          useValue: mockListPostChildrenService,
        },
        {
          provide: GetPostByIdService,
          useValue: mockGetPostByIdService,
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    createPostService = module.get<PostPostService>(PostPostService);
    listFirstPostsService =
      module.get<ListFirstPostService>(ListFirstPostService);
    deletePostService = module.get<DeletePostService>(DeletePostService);
    listPostChildrenService = module.get<ListPostChildrenService>(
      ListPostChildrenService,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('postPost', () => {
    it('should create a post successfully', async () => {
      const createPostDto: CreatePostDto = {
        content: 'Test Content',
        tags: ['tag1', 'tag2'],
        parentId: undefined,
      };

      mockCreatePostService.execute.mockResolvedValue(mockPost);

      const result = await controller.postPost(createPostDto, mockAuthUser);

      expect(result).toBeInstanceOf(PostDto);
      expect(result.id).toBe(1);
      expect(result.content).toBe('Test Content');
      expect(createPostService.execute).toHaveBeenCalledWith(
        'Test Content',
        mockAuthUser,
        ['tag1', 'tag2'],
        undefined,
      );
    });

    it('should return PostDto with all properties', async () => {
      const createPostDto: CreatePostDto = {
        content: 'Test Content',
        tags: ['tag1'],
        parentId: undefined,
      };

      mockCreatePostService.execute.mockResolvedValue(mockPost);

      const result = await controller.postPost(createPostDto, mockAuthUser);

      expect(result.id).toBe(mockPost.id);
      expect(result.content).toBe(mockPost.content);
      expect(result.userId).toBe(mockPost.userId);
      expect(result.parentId).toBeNull();
      expect(result.commentsCount).toBe(mockPost.commentsCount);
      expect(result.tags).toEqual(mockPost.tags);
    });
  });

  describe('listFirstPosts', () => {
    it('should list first batch of posts when lastId is not provided', async () => {
      mockListFirstPostsService.execute.mockResolvedValue(mockPosts);

      const result = await controller.listFirstPosts(10, mockAuthUser);

      expect(result.posts).toHaveLength(2);
      expect(result.posts[0]).toBeInstanceOf(PostDto);
      expect(result.nextId).toBe(2);
      expect(listFirstPostsService.execute).toHaveBeenCalledWith(
        10,
        null,
        undefined,
        undefined,
      );
    });

    it('should list next batch of posts when lastId is provided', async () => {
      mockListFirstPostsService.execute.mockResolvedValue(mockPosts);

      const result = await controller.listFirstPosts(10, mockAuthUser, 1);

      expect(result.posts).toHaveLength(2);
      expect(result.posts[0]).toBeInstanceOf(PostDto);
      expect(result.nextId).toBe(2);
      expect(listFirstPostsService.execute).toHaveBeenCalledWith(
        10,
        null,
        1,
        undefined,
      );
    });

    it('should return null nextId when no posts are available', async () => {
      mockListFirstPostsService.execute.mockResolvedValue([]);

      const result = await controller.listFirstPosts(10, mockAuthUser);

      expect(result.posts).toHaveLength(0);
      expect(result.nextId).toBeNull();
    });

    it('should map posts to PostDto correctly', async () => {
      mockListFirstPostsService.execute.mockResolvedValue(mockPosts);

      const result = await controller.listFirstPosts(10, mockAuthUser);

      expect(result.posts[0].id).toBe(mockPosts[0].id);
      expect(result.posts[0].title).toBe(mockPosts[0].title);
      expect(result.posts[1].id).toBe(mockPosts[1].id);
      expect(result.posts[1].title).toBe(mockPosts[1].title);
    });
  });

  describe('deletePost', () => {
    it('should delete a post successfully', async () => {
      mockDeletePostService.execute.mockResolvedValue(undefined);

      const response = await controller.deletePost(1, mockAuthUser);

      expect(response.message).toBe('Post deleted successfully');
      expect(deletePostService.execute).toHaveBeenCalledWith(1, mockAuthUser);
    });

    it('should convert string id parameter to number', async () => {
      mockDeletePostService.execute.mockResolvedValue(undefined);

      await controller.deletePost('1' as unknown as number, mockAuthUser);

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
        name: 'Other User',
        isAdmin: false,
        instituteId: null,
        courseId: null,
        universityId: null,
        isBlocked: false,
        userVersion: null,
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

  describe('listPostChildren', () => {
    it('should list child posts for a parent', async () => {
      mockListPostChildrenService.execute.mockResolvedValue(mockPosts);

      const result = await controller.listPostChildren(1);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(PostDto);
      expect(listPostChildrenService.execute).toHaveBeenCalledWith(1);
    });

    it('should convert string id parameter to number', async () => {
      mockListPostChildrenService.execute.mockResolvedValue([]);

      await controller.listPostChildren('1' as unknown as number);

      expect(listPostChildrenService.execute).toHaveBeenCalledWith(1);
    });
  });
});
