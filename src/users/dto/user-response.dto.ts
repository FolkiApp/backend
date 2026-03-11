import { ApiProperty } from '@nestjs/swagger';
import { Institute } from '../../institutes/entities/institute.entity';
import { University } from '../../universities/entities/university.entity';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'joao.silva@universidade.edu.br' })
  email: string;

  @ApiProperty({ example: 'João Silva' })
  name: string;

  @ApiProperty({ nullable: true, example: 5 })
  instituteId: number | null;

  @ApiProperty({ nullable: true, example: 12 })
  courseId: number | null;

  @ApiProperty({ example: false })
  isAdmin: boolean;

  @ApiProperty({ nullable: true, example: 3 })
  universityId: number | null;

  @ApiProperty({ nullable: true, example: '1.0.0' })
  userVersion: string | null;

  @ApiProperty({
    nullable: true,
    type: () => Institute,
    example: {
      id: 5,
      name: 'Instituto de Computação',
      isVisible: true,
      campusId: 1,
      universityId: 3,
    },
  })
  institute: Institute | null;

  @ApiProperty({
    nullable: true,
    type: () => University,
    example: {
      id: 3,
      name: 'Universidade Federal de São Carlos',
      slug: 'ufscar',
      logo: 'https://example.com/logo.png',
    },
  })
  university: University | null;

  @ApiProperty({ nullable: true, example: '🎓' })
  badge: string | null;

  constructor(
    id: number,
    email: string,
    name: string,
    instituteId: number | null,
    courseId: number | null,
    isAdmin: boolean,
    universityId: number | null,
    userVersion: string | null,
    institute: Institute | null,
    university: University | null,
    badge: string | null,
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.instituteId = instituteId;
    this.courseId = courseId;
    this.isAdmin = isAdmin;
    this.universityId = universityId;
    this.userVersion = userVersion;
    this.institute = institute;
    this.university = university;
    this.badge = badge;
  }
}
