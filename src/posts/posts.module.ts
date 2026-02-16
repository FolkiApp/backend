import { PrismaModule } from 'src/prisma/prisma.module';
import { PostsController } from './posts.controller';
import { Module } from '@nestjs/common';
import { PostPostService } from './services/post-post.service';
import { PostRepository } from './repositories/post.repository';
import { ListFirstPostService } from './services/list-first-post.service';
import { DeletePostService } from './services/delete-post.service';
import { ListPostChildrenService } from './services/list-post-children.service';
import { GetPostByIdService } from './services/get-post-by-id.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PostNotificationSqsConsumer } from './consumers/post-notification-sqs.consumer';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [PostsController],
  providers: [
    PostPostService,
    PostRepository,
    ListFirstPostService,
    DeletePostService,
    ListPostChildrenService,
    GetPostByIdService,
    PostNotificationSqsConsumer,
  ],
})
export class PostsModule {}
