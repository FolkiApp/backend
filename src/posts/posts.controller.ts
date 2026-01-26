import { Get, Controller, Param, Post, Body, Delete } from '@nestjs/common';
import { Auth } from '../common/decorators/auth.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guard';
import { PostPostsService } from './services/post-posts.service';
import { PostDto } from './dto/post.dto';
import { CreatePostDto } from './dto/create-post.dto';

@Controller()
export class PostController {
  constructor(private createPostService: PostPostsService) {}

  @Post('posts')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Adicionar uma falta para uma disciplina',
    description: 'Adiciona uma falta para a disciplina cadastrada',
  })
  async postAbsence(
    @Body() body: CreatePostDto,
    @CurrentUser() authUser: AuthUser,
  ): Promise<PostDto> {
    const post = await this.createPostService.execute(
      body.title,
      body.content,
      authUser,
    );

    return new PostDto(
      post.id,
      post.postDate,
      post.title,
      post.content,
      post.userId,
      post.commentsCount,
      post.comments,
    );
  }
}
