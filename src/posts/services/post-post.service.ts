import { Injectable, Logger, Optional } from '@nestjs/common';
import { SqsService } from '@ssut/nestjs-sqs';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { AuthUser } from '../../common/guards/auth.guard';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { EmptyPostException } from '../exceptions/empty-post.exception';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { UploadImageErrorException } from '../exceptions/upload-image-error.exception';
import { InvalidImageTypeException } from '../exceptions/invalid-image-type.exception';
import { ImageTooLargeException } from '../exceptions/image-too-large.exception';
import { MaliciousFileException } from '../exceptions/malicious-file.exception';
import { S3Service } from '../../common/services/s3.service';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class PostPostService {
  private readonly logger = new Logger(PostPostService.name);

  constructor(
    private readonly postRepository: PostRepository,
    private readonly s3Service: S3Service,
    @Optional() private readonly sqsService: SqsService,
  ) {}

  async execute(
    content: string,
    user: AuthUser,
    tags: string[],
    parentId?: number,
    files?: MulterFile[],
  ): Promise<Post> {
    this.logger.log({
      message: 'Creating post',
      userId: user.id,
      universityId: user.universityId,
      hasParent: !!parentId,
      parentId,
      tagsCount: tags.length,
      filesCount: files?.length || 0,
    });
    const imageKeys = await this.sendFilesToS3(files);
    return this.createPost(
      content,
      user.id,
      user.universityId,
      tags,
      parentId,
      imageKeys,
    );
  }

  async sendFilesToS3(files?: MulterFile[]): Promise<string[]> {
    if (!files || files.length === 0) {
      return [];
    }

    for (const file of files) {
      this.validateImageFile(file);
    }

    try {
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          const compressedBuffer = await this.compressImage(file);
          const extension = file.originalname.split('.').pop() || 'jpg';
          const uuid = randomUUID();
          return {
            key: `posts/${uuid}.${extension}`,
            buffer: compressedBuffer,
            contentType: file.mimetype,
          };
        }),
      );

      await this.s3Service.uploadFiles(compressedFiles);
      const keys = compressedFiles.map((file) => file.key);

      this.logger.log({
        message: 'Images compressed and uploaded successfully',
        count: keys.length,
      });

      return keys;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error uploading images to S3',
        error: error instanceof Error ? error.message : error,
      });
      throw new UploadImageErrorException();
    }
  }

  private async compressImage(file: MulterFile): Promise<Buffer> {
    const MAX_WIDTH = 1920;
    const MAX_HEIGHT = 1920;
    const JPEG_QUALITY = 85;
    const PNG_QUALITY = 85;
    const WEBP_QUALITY = 85;

    try {
      let sharpInstance = sharp(file.buffer).rotate();

      const metadata = await sharpInstance.metadata();
      const needsResize =
        (metadata.width && metadata.width > MAX_WIDTH) ||
        (metadata.height && metadata.height > MAX_HEIGHT);

      if (needsResize) {
        sharpInstance = sharpInstance.resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
        return await sharpInstance.jpeg({ quality: JPEG_QUALITY }).toBuffer();
      } else if (file.mimetype === 'image/png') {
        return await sharpInstance.png({ quality: PNG_QUALITY }).toBuffer();
      } else if (file.mimetype === 'image/webp') {
        return await sharpInstance.webp({ quality: WEBP_QUALITY }).toBuffer();
      } else if (file.mimetype === 'image/gif') {
        return file.buffer;
      }

      return file.buffer;
    } catch (error) {
      this.logger.error({
        message: 'Error compressing image, using original',
        filename: file.originalname,
        error: error instanceof Error ? error.message : String(error),
      });
      return file.buffer;
    }
  }

  private validateImageFile(file: MulterFile): void {
    const MAX_SIZE = 6 * 1024 * 1024;
    const ALLOWED_MIMETYPES = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      this.logger.warn({
        message: 'Invalid image type',
        mimetype: file.mimetype,
        filename: file.originalname,
      });
      throw new InvalidImageTypeException();
    }

    if (file.size > MAX_SIZE) {
      this.logger.warn({
        message: 'Image too large',
        size: file.size,
        maxSize: MAX_SIZE,
        filename: file.originalname,
      });
      throw new ImageTooLargeException();
    }

    this.checkMagicNumbers(file);

    this.logger.log({
      message: 'Image validated successfully',
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });
  }

  private checkMagicNumbers(file: MulterFile): void {
    const buffer = file.buffer;
    if (!buffer || buffer.length < 4) {
      throw new MaliciousFileException();
    }

    const magicNumbers: { [key: string]: number[][] } = {
      'image/jpeg': [[0xff, 0xd8, 0xff]],
      'image/jpg': [[0xff, 0xd8, 0xff]],
      'image/png': [[0x89, 0x50, 0x4e, 0x47]],
      'image/gif': [
        [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
        [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
      ],
      'image/webp': [[0x52, 0x49, 0x46, 0x46]],
    };

    const expectedMagic = magicNumbers[file.mimetype];
    if (!expectedMagic) {
      return;
    }

    const isValid = expectedMagic.some((magic) =>
      magic.every((byte, index) => buffer[index] === byte),
    );

    if (!isValid) {
      this.logger.warn({
        message: 'Magic numbers mismatch - possible malicious file',
        filename: file.originalname,
        declaredMimetype: file.mimetype,
        firstBytes: Array.from(buffer.slice(0, 8)),
      });
      throw new MaliciousFileException();
    }
  }

  async createPost(
    content: string,
    userId: number,
    universityId: number | null,
    tags: string[],
    parentId?: number,
    imageKeys?: string[],
  ): Promise<Post> {
    if (!content?.trim()) {
      throw new EmptyPostException();
    }
    try {
      if (parentId) {
        const parent = await this.postRepository.getPostById(parentId);
        if (!parent) {
          throw new NotFoundPostException();
        }
      }
      const post = await this.postRepository.createPost(
        content,
        userId,
        universityId,
        tags,
        parentId,
        imageKeys,
      );

      this.logger.log({
        message: 'Post created successfully',
        postId: post.id,
        userId,
        isComment: !!parentId,
        parentId,
      });

      if (parentId) {
        this.logger.log({
          message: 'Comment detected, sending notification',
          postId: post.id,
          parentId,
        });
        await this.sendCommentNotification(
          post.id,
          userId,
          post.userName,
          parentId,
        );
      }

      return post;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error creating post',
        error: error instanceof Error ? error.message : error,
      });
      if (error instanceof NotFoundPostException) {
        throw error;
      }
      throw new PostInternalErrorException();
    }
  }

  private async sendCommentNotification(
    postId: number,
    commentAuthorId: number,
    commentAuthorName: string,
    parentId: number,
  ): Promise<void> {
    if (!this.sqsService) {
      this.logger.error({
        message: 'Sqs not configured, cannot send comment notification',
        postId,
        parentId,
      });
      return;
    }

    try {
      this.logger.log({
        message: 'Sending to SQS',
        queueName: 'post-notifications',
        payload: {
          postId,
          commentAuthorId,
          commentAuthorName,
          parentId,
        },
      });

      await this.sqsService.send('post-notifications', {
        id: `post-${postId}-${Date.now()}`,
        body: {
          postId,
          commentAuthorId,
          commentAuthorName,
          parentId,
        },
      });

      this.logger.log({
        message: 'Post notification sent to SQS successfully',
        postId,
        parentId,
        queueName: 'post-notifications',
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to send post notification to SQS',
        postId,
        parentId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }
}
