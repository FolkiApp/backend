import { ApiProperty } from '@nestjs/swagger';

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

  constructor(
    id: number,
    email: string,
    name: string,
    instituteId: number | null,
    courseId: number | null,
    isAdmin: boolean,
    universityId: number | null,
    userVersion: string | null,
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.instituteId = instituteId;
    this.courseId = courseId;
    this.isAdmin = isAdmin;
    this.universityId = universityId;
    this.userVersion = userVersion;
  }
}
