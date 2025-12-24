import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FindAllUniversitiesService } from './services/find-all-universities.service';
import { UniversityResponseDto } from './dto/university-response.dto';

@ApiTags('universities')
@Controller('universities')
export class UniversitiesController {
  constructor(
    private readonly findAllUniversitiesService: FindAllUniversitiesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lista todas as universidades',
  })
  async findAll(): Promise<UniversityResponseDto[]> {
    const universities = await this.findAllUniversitiesService.execute();
    return universities.map(
      (university) =>
        new UniversityResponseDto(
          university.id,
          university.name,
          university.slug,
        ),
    );
  }
}
