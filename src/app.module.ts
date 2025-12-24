import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UniversitiesModule } from './universities/universities.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, UniversitiesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
