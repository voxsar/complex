import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface ApmLike {
  captureError?: (err: unknown) => void;
}

export const requestLogger = (apm?: ApmLike) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = process.hrtime();
    logger.info({ method: req.method, url: req.originalUrl }, 'Incoming request');

    res.on('finish', () => {
      const [s, ns] = process.hrtime(start);
      const duration = s * 1000 + ns / 1e6;
      logger.info(
        {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration,
        },
        'Request completed'
      );
    });

    res.on('error', (err: unknown) => {
      logger.error({ err }, 'Response error');
      if (apm && typeof apm.captureError === 'function') {
        apm.captureError(err);
      }
    });

    next();
  };
};
