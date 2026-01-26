import { PrismaModule } from 'src/prisma/prisma.module';
import { CommentsController } from './comments.controller';
import { Module } from '@nestjs/common';
import { CommentsService } from './services/comments.service';

@Module({
  imports: [PrismaModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
