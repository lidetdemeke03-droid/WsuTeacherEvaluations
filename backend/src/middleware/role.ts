import { Response, NextFunction } from 'express';
import { IRequest } from './auth';
import { UserRole } from '../types';

export const authorize = (...roles: UserRole[]) => {
  return (req: IRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: User role '${req.user?.role}' is not authorized to access this route.`,
      });
    }
    next();
  };
};
