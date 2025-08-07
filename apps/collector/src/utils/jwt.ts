import jwt from 'jsonwebtoken';

export interface JWTPayload {
  email: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

export class JWTService {
  private static secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: string = '7d'): string {
    return jwt.sign(payload, this.secret, { expiresIn } as jwt.SignOptions);
  }

  static verifyToken(token: string): JWTPayload {
    return jwt.verify(token, this.secret) as JWTPayload;
  }

  static generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.secret, { expiresIn: '30d' } as jwt.SignOptions);
  }

  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }
}

// Middleware for protecting routes
export function requireAuth(token: string | undefined): { success: boolean; user?: JWTPayload; error?: string } {
  if (!token || !token.startsWith('Bearer ')) {
    return { success: false, error: 'No token provided' };
  }

  try {
    const jwtToken = token.substring(7);
    const user = JWTService.verifyToken(jwtToken);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: 'Invalid token' };
  }
}