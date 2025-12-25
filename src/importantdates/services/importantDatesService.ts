import {Injectable} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { UserResponseDto } from "src/users/dto/user-response.dto";
import { importantDatesDTO } from "../dtos/importantDatesDTOS";
import { InstituteRepository } from "src/institutes/repositories/institute.repository";
import { ImportantDatesRepository } from "../repositories/importantDatesRepository";
import { InvalidUniversityException } from "src/common/exceptions/invalid-university.exception";


@Injectable()
export class importantDatesServices {

    constructor(
        private readonly instituteRepository: InstituteRepository, 
        private readonly importantDatesRepository: ImportantDatesRepository
    ){}

   async listImportantDates(user: UserResponseDto): Promise<importantDatesDTO[]> {
  let campusId: number | null = null;

  if (!user.universityId) {
    throw new InvalidUniversityException();
  }

  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  if (user.instituteId) {
    const institute = await this.instituteRepository.findById(user.instituteId);
    campusId = institute?.campusId ?? null;
  }

  const dates = await this.importantDatesRepository.findFromDateByUniversityAndCampus(
    startOfYear,
    user.universityId,
    campusId,
  );

  return dates.map(date => ({
    id: date.id,
    name: date.name,
    date: date.date,
    type: date.type,
    shouldNotify: date.shouldNotify,
    campusId: date.campusId,
    universityId: date.universityId,
  }));
   }
}