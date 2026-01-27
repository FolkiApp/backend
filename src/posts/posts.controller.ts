import { Get, Controller, Post, Body, Query } from '@nestjs/common';
import { Auth } from '../common/decorators/auth.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guard';
import { PostPostsService } from './services/post-posts.service';
import { PostDto } from './dto/post.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { ListFirstPostsService } from './services/list-first-posts.service';
import { ListNextPostsService } from './services/list-next-posts.service';

@Controller()
export class PostController {
  constructor(
    private readonly createPostService: PostPostsService,
    private readonly listFirstPostsService: ListFirstPostsService,
    private readonly listNextPostsService: ListNextPostsService,
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
    );
  }

  @Get('posts/listFirst')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar o primeiro batch de posts',
    description: 'Lista os primeiros N posts',
  })
  async listFirstPosts(
    @Query('quantity') quantity: number,
  ): Promise<{ posts: PostDto[]; nextId: number | null }> {
    const posts = await this.listFirstPostsService.execute(Number(quantity));
    const nextId = posts.length ? posts[posts.length - 1].id : null;

    return {
      posts: posts.map(
        (post) =>
          new PostDto(
            post.id,
            post.postDate,
            post.title,
            post.content,
            post.userId,
            post.commentsCount,
          ),
      ),
      nextId,
    };
  }

  @Get('posts/listNext')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar o próximo batch de posts',
    description: 'Lista os próximos N posts a partir do último ID',
  })
  async listNextPosts(
    @Query('lastId') lastId: number,
    @Query('quantity') quantity: number,
  ): Promise<{ posts: PostDto[]; nextId: number | null }> {
    const posts = await this.listNextPostsService.execute(
      Number(lastId),
      Number(quantity),
    );

    const nextId = posts.length ? posts[posts.length - 1].id : null;

    return {
      posts: posts.map(
        (post) =>
          new PostDto(
            post.id,
            post.postDate,
            post.title,
            post.content,
            post.userId,
            post.commentsCount,
          ),
      ),
      nextId,
    };
  }
}
