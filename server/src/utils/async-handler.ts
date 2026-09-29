import type { Request, RequestHandler, Response, NextFunction } from 'express';

type AsyncController = (request: Request, response: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler = (controller: AsyncController): RequestHandler => (request, response, next) => {
  void controller(request, response, next).catch(next);
};