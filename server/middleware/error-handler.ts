import { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger';
import { ZodError } from 'zod';
import { DatabaseError } from 'pg';

export interface AppError extends Error {
  status?: number;
  code?: string;
}

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  // Log el error
  log.error('Error occurred:', err);

  // Manejar errores específicos
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Error de validación',
      errors: err.errors
    });
  }

  if (err instanceof DatabaseError) {
    return res.status(500).json({
      message: 'Error de base de datos',
      code: err.code
    });
  }

  // Si el error tiene un status code específico, usarlo
  if (err.status) {
    return res.status(err.status).json({
      message: err.message,
      code: err.code
    });
  }

  // Error por defecto
  res.status(500).json({
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV !== 'production' && { error: err.message })
  });
};

export class ValidationError extends Error implements AppError {
  status: number;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

export class AuthenticationError extends Error implements AppError {
  status: number;
  constructor(message: string = 'No autorizado') {
    super(message);
    this.name = 'AuthenticationError';
    this.status = 401;
  }
}

export class ForbiddenError extends Error implements AppError {
  status: number;
  constructor(message: string = 'Acceso denegado') {
    super(message);
    this.name = 'ForbiddenError';
    this.status = 403;
  }
}

export class NotFoundError extends Error implements AppError {
  status: number;
  constructor(message: string = 'Recurso no encontrado') {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}
