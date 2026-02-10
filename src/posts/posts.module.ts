import { PrismaModule } from 'src/prisma/prisma.module';
import { PostController } from './posts.controller';
import { Module } from '@nestjs/common';
import { PostPostsService } from './services/post-posts.service';
import { PostsRepository } from './repositories/posts.repository';
import { ListFirstPostsService } from './services/list-first-posts.service';
import { ListNextPostsService } from './services/list-next-posts.service';
import { DeletePostService } from './services/delete-post.service';
import { ListPostChildrenService } from './services/list-post-children.service';

@Module({
  imports: [PrismaModule],
  controllers: [PostController],
  providers: [
    PostPostsService,
    PostsRepository,
    ListFirstPostsService,
    ListNextPostsService,
    DeletePostService,
    ListPostChildrenService,
  ],
})
export class PostsModule {}
