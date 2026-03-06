import {
  Get,
  Controller,
  Post,
  Body,
  Query,
  Delete,
  Param,
  UseInterceptors,
  UploadedFiles,
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
import { GetPostByIdService } from './services/get-post-by-id.service';
import { ListPostResponseDto } from './dto/list-post-response.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { VotePostService } from './services/vote-post.service';
import { VotePostDto } from './dto/vote-post.dto';

@Controller()
export class PostsController {
  constructor(
    private readonly createPostService: PostPostService,
    private readonly listFirstPostService: ListFirstPostService,
    private readonly deletePostService: DeletePostService,
    private readonly listPostChildrenService: ListPostChildrenService,
    private readonly getPostByIdService: GetPostByIdService,
    private readonly votePostService: VotePostService,
  ) {}

  @Post('posts')
  @UseInterceptors(FilesInterceptor('postsImages', 5))
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Criar uma postagem',
    description: 'Adiciona um post no mural',
  })
  async postPost(
    @Body() body: CreatePostDto,
    @CurrentUser() authUser: AuthUser,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<PostDto> {
    const post = await this.createPostService.execute(
      body.content,
      authUser,
      body.tags || [],
      body.parentId,
      files,
    );

    return new PostDto(
      post.id,
      post.postDate,
      post.content,
      post.userId,
      post.userName,
      post.userInstituteName,
      post.parentId ?? null,
      post.commentsCount,
      post.tags,
      post.imageUrls,
      post.upvotes,
      post.downvotes,
      post.voted,
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
      authUser.id,
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
            post.userInstituteName,
            post.parentId ?? null,
            post.commentsCount,
            post.tags,
            post.imageUrls,
            post.upvotes,
            post.downvotes,
            post.voted,
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
  async listPostChildren(
    @Param('id') id: number,
    @CurrentUser() authUser: AuthUser,
  ): Promise<PostDto[]> {
    const posts = await this.listPostChildrenService.execute(
      Number(id),
      authUser.id,
    );

    return posts.map(
      (post) =>
        new PostDto(
          post.id,
          post.postDate,
          post.content,
          post.userId,
          post.userName,
          post.userInstituteName,
          post.parentId ?? null,
          post.commentsCount,
          post.tags,
          post.imageUrls,
          post.upvotes,
          post.downvotes,
          post.voted,
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

  @Get('posts/:id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Buscar post por ID',
    description: 'Retorna um post específico pelo ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Post retornado com sucesso',
    type: PostDto,
  })
  async getPost(
    @Param('id') id: number,
    @CurrentUser() authUser: AuthUser,
  ): Promise<PostDto> {
    const post = await this.getPostByIdService.execute(
      Number(id),
      Number(authUser.id),
    );

    return new PostDto(
      post.id,
      post.postDate,
      post.content,
      post.userId,
      post.userName,
      post.userInstituteName,
      post.parentId ?? null,
      post.commentsCount,
      post.tags,
      post.imageUrls,
      post.upvotes,
      post.downvotes,
      post.voted,
    );
  }

  @Post('posts/:id/vote')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Votar em uma postagem',
    description: 'Registra ou atualiza o voto do usuário em um post',
  })
  async votePost(
    @Param('id') id: number,
    @Body() body: VotePostDto,
    @CurrentUser() authUser: AuthUser,
  ): Promise<void> {
    await this.votePostService.execute(Number(id), authUser, body.upvote);
  }
}
