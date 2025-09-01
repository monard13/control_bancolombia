import { defineConfig } from 'drizzle-kit';

// Lee la variable de entorno directamente.
// Esto es más robusto para entornos como el de la Shell de Render.
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL, ensure the database is provisioned');
}

export default defineConfig({
  out: './migrations',
  schema: './shared/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});