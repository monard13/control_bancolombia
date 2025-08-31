import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, ForbiddenError } from './error-handler';

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    throw new AuthenticationError('Autenticación requerida');
  }
  next();
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    throw new AuthenticationError('Autenticación requerida');
  }
  
  if (req.session.userRole !== 'admin') {
    throw new ForbiddenError('Se requieren privilegios de administrador');
  }
  
  next();
};
