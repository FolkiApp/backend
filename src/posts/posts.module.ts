import { PrismaModule } from 'src/prisma/prisma.module';
import { PostController } from './posts.controller';
import { Module } from '@nestjs/common';
import { PostPostsService } from './services/post-posts.service';
import { PostsRepository } from './repositories/posts.repository';

@Module({
  imports: [PrismaModule],
  controllers: [PostController],
  providers: [PostPostsService, PostsRepository],
})
export class PostsModule {}
