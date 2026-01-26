import { Module } from '@nestjs/common';
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

@Module({
  imports: [
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
export class AppModule {}
