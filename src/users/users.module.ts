import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CoursesModule } from '../courses/courses.module';
import { InstitutesModule } from '../institutes/institutes.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { UsersController } from './users.controller';
import { FindUserByIdService } from './services/find-user-by-id.service';
import { AuthenticateUserService } from './services/authenticate-user.service';
import { UpdateMeService } from './services/update-me.service';
import { ScrapJupiterService } from './services/scrap-jupiter.service';
import { AccessUFSCarSigaaService } from './services/access-ufscar-sigaa.service';
import { UserRepository } from './repositories/user.repository';
import { UserSubjectRepository } from './repositories/user-subject.repository';
import { UserNotificationIdRepository } from './repositories/user-notification-id.repository';
import { CoolNumbersService } from './services/cool-numbers.service';
import { FindUserSubjectsService } from './services/find-user-subjects.service';

@Module({
  imports: [PrismaModule, CoursesModule, InstitutesModule, SubjectsModule],
  controllers: [UsersController],
  providers: [
    FindUserByIdService,
    AuthenticateUserService,
    UpdateMeService,
    ScrapJupiterService,
    AccessUFSCarSigaaService,
    UserRepository,
    UserSubjectRepository,
    UserNotificationIdRepository,
    CoolNumbersService,
    FindUserSubjectsService,
  ],
  exports: [UserRepository],
})
export class UsersModule {}
