import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { CommentsRepository } from '../repositories/comments.repository';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(private readonly commentsRepository: CommentsRepository) {}
}
