import { Test, TestingModule } from '@nestjs/testing';
import { PostPostService } from '../services/post-post.service';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { EmptyPostException } from '../exceptions/empty-post.exception';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { AuthUser } from '../../common/guards/auth.guard';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { InvalidImageTypeException } from '../exceptions/invalid-image-type.exception';
import { ImageTooLargeException } from '../exceptions/image-too-large.exception';
import { MaliciousFileException } from '../exceptions/malicious-file.exception';
import { S3Service } from '../../common/services/s3.service';

describe('PostPostService', () => {
  let service: PostPostService;
  let postsRepository: PostRepository;

  const mockPostsRepository: jest.Mocked<
    Pick<PostRepository, 'createPost' | 'getPostById'>
  > = {
    createPost: jest.fn(),
    getPostById: jest.fn(),
  };

  const mockS3Service = {
    uploadFile: jest.fn(),
    uploadFiles: jest.fn(),
    getPublicUrl: jest.fn(),
    getPublicUrls: jest.fn(),
    deleteObject: jest.fn(),
    deleteObjects: jest.fn(),
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
    institute: null,
    university: null,
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
    [],
    1,
    0,
    'up',
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostPostService,
        {
          provide: PostRepository,
          useValue: mockPostsRepository,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    service = module.get<PostPostService>(PostPostService);
    postsRepository = module.get<PostRepository>(PostRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should create a post successfully with valid content', async () => {
      mockPostsRepository.createPost.mockResolvedValue(mockPost);
      mockPostsRepository.getPostById.mockResolvedValue(null);
      mockS3Service.uploadFiles.mockResolvedValue([]);

      const result = await service.execute(
        'Test Content',
        mockAuthUser,
        ['tag1', 'tag2'],
        undefined,
      );

      expect(result).toEqual(mockPost);
      expect(postsRepository.createPost).toHaveBeenCalledWith(
        'Test Content',
        1,
        null,
        ['tag1', 'tag2'],
        undefined,
        [],
      );
    });

    it('should throw EmptyPostException when content is empty', async () => {
      mockS3Service.uploadFiles.mockResolvedValue([]);

      await expect(
        service.execute('', mockAuthUser, [], undefined),
      ).rejects.toThrow(EmptyPostException);

      expect(postsRepository.createPost).not.toHaveBeenCalled();
    });

    it('should throw EmptyPostException when content is only whitespace', async () => {
      mockS3Service.uploadFiles.mockResolvedValue([]);

      await expect(
        service.execute('   ', mockAuthUser, [], undefined),
      ).rejects.toThrow(EmptyPostException);

      expect(postsRepository.createPost).not.toHaveBeenCalled();
    });

    it('should throw PostInternalErrorException when repository throws unexpected error', async () => {
      mockPostsRepository.createPost.mockRejectedValue(
        new Error('Database error'),
      );
      mockPostsRepository.getPostById.mockResolvedValue(null);
      mockS3Service.uploadFiles.mockResolvedValue([]);

      await expect(
        service.execute('Test Content', mockAuthUser, [], undefined),
      ).rejects.toThrow(PostInternalErrorException);
    });

    it('should handle tags in post creation', async () => {
      const tags = ['tag1', 'tag2', 'tag3'];
      mockPostsRepository.createPost.mockResolvedValue(
        new Post(
          1,
          new Date(),
          'Test Content',
          1,
          'Test User',
          null,
          null,
          0,
          tags,
          null,
          [],
          1,
          0,
          'up',
        ),
      );
      mockPostsRepository.getPostById.mockResolvedValue(null);
      mockS3Service.uploadFiles.mockResolvedValue([]);

      const result = await service.execute(
        'Test Content',
        mockAuthUser,
        tags,
        undefined,
      );

      expect(result.tags).toEqual(tags);
      expect(postsRepository.createPost).toHaveBeenCalledWith(
        'Test Content',
        1,
        null,
        tags,
        undefined,
        [],
      );
    });

    it('should create post with empty tags array', async () => {
      mockPostsRepository.createPost.mockResolvedValue(mockPost);
      mockPostsRepository.getPostById.mockResolvedValue(null);
      mockS3Service.uploadFiles.mockResolvedValue([]);

      await service.execute('Test Content', mockAuthUser, [], undefined);

      expect(postsRepository.createPost).toHaveBeenCalledWith(
        'Test Content',
        1,
        null,
        [],
        undefined,
        [],
      );
    });

    it('should create a child post when parentId is provided', async () => {
      mockPostsRepository.getPostById.mockResolvedValue(mockPost);
      mockPostsRepository.createPost.mockResolvedValue(mockPost);
      mockS3Service.uploadFiles.mockResolvedValue([]);

      await service.execute('Child Content', mockAuthUser, [], 10);

      expect(postsRepository.getPostById).toHaveBeenCalledWith(10);
      expect(postsRepository.createPost).toHaveBeenCalledWith(
        'Child Content',
        1,
        null,
        [],
        10,
        [],
      );
    });

    it('should throw NotFoundPostException when parent post does not exist', async () => {
      mockPostsRepository.getPostById.mockResolvedValue(null);
      mockS3Service.uploadFiles.mockResolvedValue([]);

      await expect(
        service.execute('Child Content', mockAuthUser, [], 999),
      ).rejects.toThrow(NotFoundPostException);

      expect(postsRepository.createPost).not.toHaveBeenCalled();
    });
  });

  describe('sendFilesToS3', () => {
    interface MockFile {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    }

    const createMockFile = (
      mimetype: string,
      size: number,
      buffer: Buffer,
      filename = 'test.jpg',
    ): MockFile => ({
      fieldname: 'postsImages',
      originalname: filename,
      encoding: '7bit',
      mimetype,
      size,
      buffer,
    });

    it('should return empty array when no files provided', async () => {
      const result = await service.sendFilesToS3(undefined);
      expect(result).toEqual([]);
    });

    it('should upload valid image files successfully', async () => {
      const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const mockFile = createMockFile(
        'image/jpeg',
        1024 * 1024,
        validJpegBuffer,
      );

      mockS3Service.uploadFiles.mockResolvedValue(['key1']);

      const result = await service.sendFilesToS3([mockFile]);

      expect(result.length).toBe(1);
      expect(result[0]).toContain('posts/');
      expect(mockS3Service.uploadFiles).toHaveBeenCalled();
    });

    it('should throw InvalidImageTypeException for non-image files', async () => {
      const mockFile = createMockFile(
        'application/pdf',
        1024,
        Buffer.from([0x25, 0x50, 0x44, 0x46]),
      );

      await expect(service.sendFilesToS3([mockFile])).rejects.toThrow(
        InvalidImageTypeException,
      );
    });

    it('should throw ImageTooLargeException for files larger than 6MB', async () => {
      const largeSize = 7 * 1024 * 1024;
      const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const mockFile = createMockFile('image/jpeg', largeSize, validJpegBuffer);

      await expect(service.sendFilesToS3([mockFile])).rejects.toThrow(
        ImageTooLargeException,
      );
    });

    it('should throw MaliciousFileException for files with mismatched magic numbers', async () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      const mockFile = createMockFile('image/jpeg', 1024, pngBuffer);

      await expect(service.sendFilesToS3([mockFile])).rejects.toThrow(
        MaliciousFileException,
      );
    });

    it('should accept valid PNG files', async () => {
      const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      const mockFile = createMockFile(
        'image/png',
        1024 * 1024,
        validPngBuffer,
        'test.png',
      );

      mockS3Service.uploadFiles.mockResolvedValue(['key1']);

      const result = await service.sendFilesToS3([mockFile]);

      expect(result.length).toBe(1);
      expect(mockS3Service.uploadFiles).toHaveBeenCalled();
    });

    it('should accept valid GIF files', async () => {
      const validGifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
      const mockFile = createMockFile(
        'image/gif',
        1024 * 1024,
        validGifBuffer,
        'test.gif',
      );

      mockS3Service.uploadFiles.mockResolvedValue(['key1']);

      const result = await service.sendFilesToS3([mockFile]);

      expect(result.length).toBe(1);
      expect(mockS3Service.uploadFiles).toHaveBeenCalled();
    });

    it('should validate multiple files', async () => {
      const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);

      const mockFiles = [
        createMockFile('image/jpeg', 1024 * 1024, validJpegBuffer, 'test1.jpg'),
        createMockFile(
          'image/png',
          2 * 1024 * 1024,
          validPngBuffer,
          'test2.png',
        ),
      ];

      mockS3Service.uploadFiles.mockResolvedValue(['key1', 'key2']);

      const result = await service.sendFilesToS3(mockFiles);

      expect(result.length).toBe(2);
      expect(mockS3Service.uploadFiles).toHaveBeenCalled();
    });
  });

  describe('createPost', () => {
    it('should create post with valid parameters', async () => {
      mockPostsRepository.createPost.mockResolvedValue(mockPost);
      mockPostsRepository.getPostById.mockResolvedValue(null);

      const result = await service.createPost(
        'Test Content',
        1,
        null,
        ['tag1'],
        undefined,
      );

      expect(result).toEqual(mockPost);
    });

    it('should throw EmptyPostException for empty content', async () => {
      await expect(
        service.createPost('', 1, null, [], undefined),
      ).rejects.toThrow(EmptyPostException);
    });

    it('should throw EmptyPostException for null content', async () => {
      await expect(
        service.createPost(null as unknown as string, 1, null, [], undefined),
      ).rejects.toThrow(EmptyPostException);
    });

    it('should throw EmptyPostException for undefined content', async () => {
      await expect(
        service.createPost(
          undefined as unknown as string,
          1,
          null,
          [],
          undefined,
        ),
      ).rejects.toThrow(EmptyPostException);
    });
  });
});
