import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { validate } from '../middleware/validate';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { ValidationError, AuthenticationError, ForbiddenError } from '../middleware/error-handler';
import { errorHandler } from '../middleware/error-handler';
import { cacheMiddleware } from '../middleware/cache';

const app = express();

// Configuración básica para tests
app.use(express.json());
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false
}));

// Ruta de prueba para validación
app.post('/test/validate',
  validate({
    body: {
      name: (val: any) => {
        if (typeof val !== 'string') throw new Error('Name must be a string');
        return val;
      }
    }
  }),
  (req, res) => res.json(req.body)
);

// Ruta de prueba para autenticación
app.get('/test/auth',
  requireAuth,
  (req, res) => res.json({ message: 'authenticated' })
);

// Ruta de prueba para admin
app.get('/test/admin',
  requireAdmin,
  (req, res) => res.json({ message: 'admin access' })
);

// Ruta de prueba para caché
app.get('/test/cache',
  cacheMiddleware({ ttl: 1 }),
  (req, res) => res.json({ timestamp: Date.now() })
);

// Manejador de errores
app.use(errorHandler);

describe('Middleware Tests', () => {
  describe('Validation Middleware', () => {
    it('should pass valid data', async () => {
      const response = await request(app)
        .post('/test/validate')
        .send({ name: 'test' });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ name: 'test' });
    });

    it('should reject invalid data', async () => {
      const response = await request(app)
        .post('/test/validate')
        .send({ name: 123 });
      
      expect(response.status).toBe(400);
    });
  });

  describe('Authentication Middleware', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/test/auth');
      
      expect(response.status).toBe(401);
    });

    it('should allow authenticated requests', async () => {
      const agent = request.agent(app);
      await agent.post('/login').send({ userId: '123' });
      
      const response = await agent.get('/test/auth');
      expect(response.status).toBe(200);
    });
  });

  describe('Cache Middleware', () => {
    it('should cache responses', async () => {
      const first = await request(app).get('/test/cache');
      const second = await request(app).get('/test/cache');
      
      expect(first.body.timestamp).toBe(second.body.timestamp);
    });

    it('should expire cache', async () => {
      const first = await request(app).get('/test/cache');
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const second = await request(app).get('/test/cache');
      expect(first.body.timestamp).not.toBe(second.body.timestamp);
    });
  });

  describe('Error Handler', () => {
    it('should handle ValidationError', async () => {
      const error = new ValidationError('test error');
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      errorHandler(error, {} as any, res as any, jest.fn());
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle unknown errors', async () => {
      const error = new Error('unknown error');
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      errorHandler(error, {} as any, res as any, jest.fn());
      
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
