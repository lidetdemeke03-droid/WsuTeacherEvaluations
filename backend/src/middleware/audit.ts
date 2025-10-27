import { Response, NextFunction } from 'express';
import { IRequest } from './auth';
import AuditLog from '../models/AuditLog';
import { LogLevel } from '../types';

export const audit = (action: string) => {
  return async (req: IRequest, res: Response, next: NextFunction) => {
    // Let the request finish
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await AuditLog.create({
            user: req.user?._id,
            action: action,
            level: LogLevel.Info,
            details: {
              method: req.method,
              url: req.originalUrl,
              body: req.body,
              params: req.params,
              query: req.query,
              statusCode: res.statusCode,
            },
          });
        } catch (error) {
          console.error('Failed to create audit log:', error);
        }
      }
    });
    next();
  };
};
