import { Request, Response, NextFunction } from 'express';
import { Session } from 'express-session';

interface TestSession extends Session {
  userId?: string;
  userRole?: string;
}

export const mockSession = (userId?: string, userRole: string = 'user') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    (req.session as TestSession).userId = userId;
    (req.session as TestSession).userRole = userRole;
    next();
  };
};
