import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InstituteRepository } from './repositories/institute.repository';

@Module({
  imports: [PrismaModule],
  providers: [InstituteRepository],
  exports: [InstituteRepository],
})
export class InstitutesModule {}
