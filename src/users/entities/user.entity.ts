export class User {
  id: number;
  email: string;
  name: string;
  instituteId: number | null;
  courseId: number | null;
  isAdmin: boolean;
  isBlocked: boolean;
  universityId: number | null;
  userVersion: string | null;
  createdAt: Date;
  lastLogin: Date | null;
  lastAccess: Date | null;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
