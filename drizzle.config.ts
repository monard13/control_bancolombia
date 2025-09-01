import { defineConfig } from 'drizzle-kit';
import { config } from './server/config';

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

export default defineConfig({
  out: './migrations',
  schema: './shared/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.databaseUrl,
  },
  // Añade esta propiedad para forzar el modo SSL
  driver: 'pg',
  verbose: true,
  strict: true,
});