import { Injectable } from '@nestjs/common';
import { University } from './entities/university.entity';

@Injectable()
export class UniversitiesService {
  findAll(): University[] {
    return [];
  }
}
