import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { getDatabaseUrl } from './config';
import * as schema from '@shared/schema';

const databaseUrl = getDatabaseUrl();
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

// Configura el pool de conexiones con SSL requerido para producción en Render
export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });
