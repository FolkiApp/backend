import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UniversitiesModule } from './universities/universities.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ImportantDateModule } from './importantdates/important-date.module';
import { InstitutesModule } from './institutes/institutes.module';
import { AbsenceModule } from './absences/absence.module';
import { ActivitiesModule } from './activities/activities.module';
import { GradesModule } from './grades/grades.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PostsModule } from './posts/posts.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    WinstonModule.forRoot(winstonConfig),
    CommonModule,
    PrismaModule,
    NotificationsModule,
    UniversitiesModule,
    UsersModule,
    ImportantDateModule,
    InstitutesModule,
    AbsenceModule,
    ActivitiesModule,
    GradesModule,
    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
