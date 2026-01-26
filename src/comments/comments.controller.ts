import { Get, Controller, Param, Post, Body, Delete } from '@nestjs/common';
import { Auth } from '../common/decorators/auth.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guard';
import { CommentsService } from './services/comments.service';

@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}
}
