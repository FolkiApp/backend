import { Test, TestingModule } from '@nestjs/testing';
import { ListPostChildrenService } from '../services/list-post-children.service';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';

describe('ListPostChildrenService', () => {
  let service: ListPostChildrenService;
  let postsRepository: PostRepository;

  const mockPostsRepository: jest.Mocked<
    Pick<PostRepository, 'getPostById' | 'listChildrenByParentId'>
  > = {
    getPostById: jest.fn(),
    listChildrenByParentId: jest.fn(),
  };

  const mockParent: Post = new Post(
    1,
    new Date('2025-03-10T12:30:00.000Z'),
    'Parent Content',
    1,
    'Test User',
    null,
    null,
    2,
    ['tag1'],
    null,
    [],
    0,
    0,
    null,
  );

  const mockChildren: Post[] = [
    new Post(
      2,
      new Date('2025-03-11T12:30:00.000Z'),
      'Child Content 1',
      1,
      'Test User',
      null,
      1,
      0,
      ['tag2'],
      null,
      [],
      0,
      0,
      null,
    ),
    new Post(
      3,
      new Date('2025-03-10T12:32:00.000Z'),
      'Child Content 2',
      3,
      'Another User',
      null,
      1,
      0,
      ['tag3'],
      null,
      [],
      0,
      0,
      null,
    ),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListPostChildrenService,
        {
          provide: PostRepository,
          useValue: mockPostsRepository,
        },
      ],
    }).compile();

    service = module.get<ListPostChildrenService>(ListPostChildrenService);
    postsRepository = module.get<PostRepository>(PostRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should list children posts for a parent', async () => {
      mockPostsRepository.getPostById.mockResolvedValue(mockParent);
      mockPostsRepository.listChildrenByParentId.mockResolvedValue(
        mockChildren,
      );

      const result = await service.execute(1, 1);

      expect(result).toEqual(mockChildren);
      expect(postsRepository.getPostById).toHaveBeenCalledWith(1, 1);
      expect(postsRepository.listChildrenByParentId).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundPostException when parent does not exist', async () => {
      mockPostsRepository.getPostById.mockResolvedValue(null);

      await expect(service.execute(999, 1)).rejects.toThrow(
        NotFoundPostException,
      );

      expect(postsRepository.listChildrenByParentId).not.toHaveBeenCalled();
    });

    it('should throw PostInternalErrorException on unexpected error', async () => {
      mockPostsRepository.getPostById.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(1, 1)).rejects.toThrow(
        PostInternalErrorException,
      );
    });
  });
});
