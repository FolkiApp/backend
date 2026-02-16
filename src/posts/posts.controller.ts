import {
  Get,
  Controller,
  Post,
  Body,
  Query,
  Delete,
  Param,
} from '@nestjs/common';
import { Auth } from '../common/decorators/auth.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guard';
import { PostPostService } from './services/post-post.service';
import { PostDto } from './dto/post.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { ListFirstPostService } from './services/list-first-post.service';
import { DeletePostService } from './services/delete-post.service';
import { ListPostChildrenService } from './services/list-post-children.service';
import { ListPostResponseDto } from './dto/list-post-response.dto';

@Controller()
export class PostsController {
  constructor(
    private readonly createPostService: PostPostService,
    private readonly listFirstPostService: ListFirstPostService,
    private readonly deletePostService: DeletePostService,
    private readonly listPostChildrenService: ListPostChildrenService,
  ) {}

  @Post('posts')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Criar uma postagem',
    description: 'Adiciona um post no mural',
  })
  async postPost(
    @Body() body: CreatePostDto,
    @CurrentUser() authUser: AuthUser,
  ): Promise<PostDto> {
    const post = await this.createPostService.execute(
      body.content,
      authUser,
      body.tags || [],
      body.parentId,
    );

    return new PostDto(
      post.id,
      post.postDate,
      post.content,
      post.userId,
      post.userName,
      post.parentId ?? null,
      post.commentsCount,
      post.tags,
    );
  }

  @Get('posts')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar o primeiro batch de posts',
    description: 'Lista os primeiros N posts',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de posts retornada com sucesso',
    type: ListPostResponseDto,
  })
  @ApiQuery({ name: 'lastId', required: false, type: Number })
  @ApiQuery({ name: 'quantity', required: true, type: Number })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  async listFirstPosts(
    @Query('quantity') quantity: number,
    @CurrentUser() authUser: AuthUser,
    @Query('lastId') lastId?: number,
    @Query('tags') tags?: string | string[],
  ): Promise<{ posts: PostDto[]; nextId: number | null }> {
    const tagsArray = tags ? (Array.isArray(tags) ? tags : [tags]) : undefined;
    const posts = await this.listFirstPostService.execute(
      Number(quantity),
      authUser.universityId,
      lastId ? Number(lastId) : undefined,
      tagsArray,
    );
    const nextId = posts.length ? posts[posts.length - 1].id : null;

    return {
      posts: posts.map(
        (post) =>
          new PostDto(
            post.id,
            post.postDate,
            post.content,
            post.userId,
            post.userName,
            post.parentId ?? null,
            post.commentsCount,
            post.tags,
          ),
      ),
      nextId,
    };
  }

  @Get('posts/:id/children')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar nodes filhos de um post',
    description: 'Lista todos os nodes filhos (sub posts) de um post pai',
  })
  async listPostChildren(@Param('id') id: number): Promise<PostDto[]> {
    const posts = await this.listPostChildrenService.execute(Number(id));

    return posts.map(
      (post) =>
        new PostDto(
          post.id,
          post.postDate,
          post.content,
          post.userId,
          post.userName,
          post.parentId ?? null,
          post.commentsCount,
          post.tags,
        ),
    );
  }

  @Delete('posts/:id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deletar uma postagem',
    description: 'Remove um post do mural (apenas o autor pode deletar)',
  })
  async deletePost(
    @Param('id') id: number,
    @CurrentUser() authUser: AuthUser,
  ): Promise<{ message: string }> {
    await this.deletePostService.execute(Number(id), authUser);
    return { message: 'Post deleted successfully' };
  }
}
