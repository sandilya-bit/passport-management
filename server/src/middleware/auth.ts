import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { asyncHandler } from '../utils/async-handler';

export type AuthUser = { id: string; role: 'APPLICANT' | 'OFFICER' | 'ADMIN' };
declare global {
  namespace Express {
    interface Request { user?: AuthUser }
  }
}

export const authenticate: RequestHandler = asyncHandler(async (request, _response, next) => {
  const [scheme, token] = (request.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Authentication is required.');

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
    if (typeof payload.sub !== 'string' || typeof payload.role !== 'string') throw new Error('Invalid token payload.');
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true, isActive: true } });
    if (!user?.isActive) throw new ApiError(401, 'Account is unavailable.');
    request.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Invalid or expired access token.');
  }
});

export function authorize(...roles: AuthUser['role'][]): RequestHandler {
  return (request, _response, next) => {
    if (!request.user) return next(new ApiError(401, 'Authentication is required.'));
    if (!roles.includes(request.user.role)) return next(new ApiError(403, 'You do not have permission to perform this action.'));
    next();
  };
}