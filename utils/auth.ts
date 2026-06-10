import { authService } from '../services/AuthService';
import { UserRole } from '../models/User';

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export function verifyAuth(req: Request, allowedRoles?: UserRole[]) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Access token missing or invalid format', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = authService.verifyAccessToken(token);

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
      throw new AuthError('Forbidden: Insufficient privileges', 403);
    }

    return payload;
  } catch (error: any) {
    throw new AuthError(error.message || 'Unauthorized', 401);
  }
}
