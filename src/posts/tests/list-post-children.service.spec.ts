import { Test, TestingModule } from '@nestjs/testing';
import { ListPostChildrenService } from '../services/list-post-children.service';
import { PostsRepository } from '../repositories/posts.repository';
import { Posts } from '../entities/posts.entity';
import { NotFoundPostException } from '../exceptions/not-found-posts.exception';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';

describe('ListPostChildrenService', () => {
  let service: ListPostChildrenService;
  let postsRepository: PostsRepository;

  const mockPostsRepository = {
    getPostById: jest.fn(),
    listChildrenByParentId: jest.fn(),
  };

  const mockParent = new Posts(
    1,
    new Date('2025-03-10T12:30:00.000Z'),
    'Parent Post',
    'Parent Content',
    1,
    null,
    2,
    ['tag1'],
  );

  const mockChildren: Posts[] = [
    new Posts(
      2,
      new Date('2025-03-10T12:31:00.000Z'),
      'Child Post 1',
      'Child Content 1',
      2,
      1,
      0,
      ['tag2'],
    ),
    new Posts(
      3,
      new Date('2025-03-10T12:32:00.000Z'),
      'Child Post 2',
      'Child Content 2',
      3,
      1,
      0,
      ['tag3'],
    ),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListPostChildrenService,
        {
          provide: PostsRepository,
          useValue: mockPostsRepository,
        },
      ],
    }).compile();

    service = module.get<ListPostChildrenService>(ListPostChildrenService);
    postsRepository = module.get<PostsRepository>(PostsRepository);

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

      const result = await service.execute(1);

      expect(result).toEqual(mockChildren);
      expect(postsRepository.getPostById).toHaveBeenCalledWith(1);
      expect(postsRepository.listChildrenByParentId).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundPostException when parent does not exist', async () => {
      mockPostsRepository.getPostById.mockResolvedValue(null);

      await expect(service.execute(999)).rejects.toThrow(NotFoundPostException);

      expect(postsRepository.listChildrenByParentId).not.toHaveBeenCalled();
    });

    it('should throw PostInternalErrorException on unexpected error', async () => {
      mockPostsRepository.getPostById.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(1)).rejects.toThrow(
        PostInternalErrorException,
      );
    });
  });
});
