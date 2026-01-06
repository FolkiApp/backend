import { ApiProperty } from '@nestjs/swagger';

class SubjectInfoDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Cálculo I' })
  name: string;

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }
}

class SubjectClassDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 2025 })
  year: number;

  @ApiProperty({ type: SubjectInfoDto })
  subject: SubjectInfoDto;

  constructor(id: number, year: number, subject: SubjectInfoDto) {
    this.id = id;
    this.year = year;
    this.subject = subject;
  }
}

class ActivityUserDto {
  @ApiProperty({ example: 'João Silva' })
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

export { SubjectInfoDto, SubjectClassDto, ActivityUserDto };

export class ActivityResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Trabalho de Cálculo' })
  name: string;

  @ApiProperty({ example: 'Resolver exercícios 1-10', nullable: true })
  description: string | null;

  @ApiProperty({ example: '2025-12-31T15:00:00.000Z' })
  finishDate: Date;

  @ApiProperty({ example: '2025-01-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-01T10:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null, nullable: true })
  deletedAt: Date | null;

  @ApiProperty({ example: false })
  isPrivate: boolean;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 1 })
  subjectClassId: number;

  @ApiProperty({ example: false })
  checked: boolean;

  @ApiProperty({ type: SubjectClassDto })
  subjectClass: SubjectClassDto;

  @ApiProperty({ type: ActivityUserDto })
  user: ActivityUserDto;

  constructor(
    id: number,
    name: string,
    description: string | null,
    finishDate: Date,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
    isPrivate: boolean,
    userId: number,
    subjectClassId: number,
    checked: boolean,
    subjectClass: SubjectClassDto,
    user: ActivityUserDto,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.finishDate = finishDate;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
    this.isPrivate = isPrivate;
    this.userId = userId;
    this.subjectClassId = subjectClassId;
    this.checked = checked;
    this.subjectClass = subjectClass;
    this.user = user;
  }
}
