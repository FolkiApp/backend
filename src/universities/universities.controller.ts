import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse } from '@nestjs/swagger';
import { FindAllUniversitiesService } from './services/find-all-universities.service';
import { CreateUniversityService } from './services/create-university.service';
import { UniversityResponseDto } from './dto/university-response.dto';
import { CreateUniversityDto } from './dto/create-university.dto';

@ApiTags('universities')
@Controller('universities')
export class UniversitiesController {
  constructor(
    private readonly findAllUniversitiesService: FindAllUniversitiesService,
    private readonly createUniversityService: CreateUniversityService,
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

  @Post()
  @ApiOperation({
    summary: 'Cria uma nova universidade',
  })
  @ApiCreatedResponse({
    description: 'Universidade criada com sucesso',
    type: UniversityResponseDto,
  })
  async create(
    @Body() createUniversityDto: CreateUniversityDto,
  ): Promise<UniversityResponseDto> {
    const university =
      await this.createUniversityService.execute(createUniversityDto);
    return new UniversityResponseDto(
      university.id,
      university.name,
      university.slug,
    );
  }
}
