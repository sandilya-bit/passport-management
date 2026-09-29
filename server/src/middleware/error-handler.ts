import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/api-error';

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new ApiError(404, `Route ${request.method} ${request.path} was not found.`));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return response.status(409).json({ error: 'A record with these details already exists.' });
    if (error.code === 'P2025') return response.status(404).json({ error: 'The requested record was not found.' });
    if (error.code === 'P2003') return response.status(409).json({ error: 'This record is referenced by another record.' });
  }

  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof ApiError ? error.message : 'An unexpected server error occurred.';
  if (statusCode >= 500) console.error(error);
  response.status(statusCode).json({ error: message, ...(error instanceof ApiError && error.details ? { details: error.details } : {}) });
};