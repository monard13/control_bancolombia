import type { Config } from 'jest';
import { jest } from '@jest/globals';

// Mock de configuración
const mockConfig = {
  isProduction: false,
  isDeployment: false,
  isHTTPS: false,
  port: 5000,
  sessionSecret: 'test-secret'
};

jest.mock('../config', () => ({
  config: mockConfig
}));

// Establecer variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.PORT = '5000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.SESSION_SECRET = 'test-secret-key';

// Deshabilitar logging durante los tests
jest.mock('../utils/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));
