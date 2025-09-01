import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from './config';
import * as schema from '@shared/schema';

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

// Configura el pool de conexiones con SSL requerido para producción en Render
export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });