import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { ValidationError, AuthenticationError, ForbiddenError } from '../middleware/error-handler';
import { errorHandler } from '../middleware/error-handler';
import { cacheMiddleware } from '../middleware/cache';
import { mockSession } from './helpers/mockSession';

const app = express();

// Configuración básica para tests
app.use(express.json());
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false
}));

// Ruta de prueba para validación
const testSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'El nombre es requerido')
  })
});

app.post('/test/validate',
  validate(testSchema),
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
      expect(response.body.message).toBe('Autenticación requerida');
    });

    it('should allow authenticated requests', async () => {
      // Configurar ruta de prueba con sesión autenticada
      app.get('/test/auth-with-session',
        mockSession('123', 'user'),
        requireAuth,
        (req, res) => res.json({ message: 'authenticated' })
      );

      const response = await request(app)
        .get('/test/auth-with-session');
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('authenticated');
    });

    it('should reject non-admin access to admin routes', async () => {
      // Configurar ruta de prueba con sesión de usuario normal
      app.get('/test/admin-with-session',
        mockSession('123', 'user'),
        requireAdmin,
        (req, res) => res.json({ message: 'admin access' })
      );

      const response = await request(app)
        .get('/test/admin-with-session');
      
      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Se requieren privilegios de administrador');
    });

    it('should allow admin access to admin routes', async () => {
      // Configurar ruta de prueba con sesión de administrador
      app.get('/test/admin-with-session-2',
        mockSession('123', 'admin'),
        requireAdmin,
        (req, res) => res.json({ message: 'admin access' })
      );

      const response = await request(app)
        .get('/test/admin-with-session-2');
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('admin access');
    });
  });

  describe('Cache Middleware', () => {
    it('should cache responses', async () => {
      // Configurar ruta con datos dinámicos para probar el caché
      app.get('/test/cache-dynamic',
        cacheMiddleware({ ttl: 1 }),
        (_req, res) => res.json({ 
          timestamp: Date.now(),
          random: Math.random()
        })
      );

      const first = await request(app).get('/test/cache-dynamic');
      const second = await request(app).get('/test/cache-dynamic');
      
      expect(first.body.timestamp).toBe(second.body.timestamp);
      expect(first.body.random).toBe(second.body.random);
    });

    it('should expire cache', async () => {
      const first = await request(app).get('/test/cache-dynamic');
      
      // Esperar a que expire el caché (TTL = 1 segundo)
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const second = await request(app).get('/test/cache-dynamic');
      expect(first.body.timestamp).not.toBe(second.body.timestamp);
      expect(first.body.random).not.toBe(second.body.random);
    });

    it('should not cache non-GET requests', async () => {
      // Configurar ruta POST para probar que no se cachea
      app.post('/test/cache-post',
        cacheMiddleware({ ttl: 1 }),
        (_req, res) => res.json({ 
          timestamp: Date.now()
        })
      );

      const first = await request(app).post('/test/cache-post');
      const second = await request(app).post('/test/cache-post');
      
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
