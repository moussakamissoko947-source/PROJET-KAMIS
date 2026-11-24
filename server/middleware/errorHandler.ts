import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  // If response has already started streaming, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 400;
  const message = err.message || 'Une erreur inattendue est survenue.';

  res.status(status).json({
    error: message,
    code: err.code || undefined
  });
}
