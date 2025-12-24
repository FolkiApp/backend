import * as jwt from 'jsonwebtoken';

export function createToken(userId: number, securePin: string): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET não configurado no ambiente');
  }

  return jwt.sign(
    {
      id: userId,
      securePin,
    },
    jwtSecret,
    {
      expiresIn: '365d',
    },
  );
}
