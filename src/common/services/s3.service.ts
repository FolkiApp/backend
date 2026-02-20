/* eslint-disable */
import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { S3UploadException } from '../exceptions/s3-upload.exception';
import { S3DeleteException } from '../exceptions/s3-delete.exception';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
    });
    this.bucketName = process.env.AWS_BUCKET_NAME || '';
    this.region = process.env.AWS_REGION || 'us-east-1';
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  getPublicUrls(keys: string[]): string[] {
    return keys.map((key) => this.getPublicUrl(key));
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );

      this.logger.log({
        message: 'File uploaded to S3',
        key,
        contentType,
      });

      return this.getPublicUrl(key);
    } catch (error) {
      this.logger.error({
        message: 'Error uploading file to S3',
        key,
        error: error instanceof Error ? error.message : error,
      });
      throw new S3UploadException();
    }
  }

  async uploadFiles(
    files: Array<{ key: string; buffer: Buffer; contentType: string }>,
  ): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file.key, file.buffer, file.contentType),
    );
    return Promise.all(uploadPromises);
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      this.logger.log({
        message: 'Object deleted from S3',
        key,
      });
    } catch (error) {
      this.logger.error({
        message: 'Error deleting object from S3',
        key,
        error: error instanceof Error ? error.message : error,
      });
      throw new S3DeleteException();
    }
  }

  async deleteObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    try {
      await this.s3Client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucketName,
          Delete: {
            Objects: keys.map((key) => ({ Key: key })),
          },
        }),
      );

      this.logger.log({
        message: 'Objects deleted from S3',
        count: keys.length,
      });
    } catch (error) {
      this.logger.error({
        message: 'Error deleting objects from S3',
        keysCount: keys.length,
        error: error instanceof Error ? error.message : error,
      });
      throw new S3DeleteException();
    }
  }
}
/* eslint-disable */
