import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CoursesModule } from '../courses/courses.module';
import { InstitutesModule } from '../institutes/institutes.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { UsersController } from './users.controller';
import { FindUserByIdService } from './services/find-user-by-id.service';
import { AuthenticateUserService } from './services/authenticate-user.service';
import { ScrapJupiterService } from './services/scrap-jupiter.service';
import { AccessUFSCarSigaaService } from './services/access-ufscar-sigaa.service';
import { UserRepository } from './repositories/user.repository';
import { UserSubjectRepository } from './repositories/user-subject.repository';

@Module({
  imports: [PrismaModule, CoursesModule, InstitutesModule, SubjectsModule],
  controllers: [UsersController],
  providers: [
    FindUserByIdService,
    AuthenticateUserService,
    ScrapJupiterService,
    AccessUFSCarSigaaService,
    UserRepository,
    UserSubjectRepository,
  ],
})
export class UsersModule {}
