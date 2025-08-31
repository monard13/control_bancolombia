import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import fs from 'fs';

neonConfig.webSocketConstructor = ws;

// Handle different database URL sources between development and production
function getDatabaseUrl(): string {
  const isDeployment = !!(process.env.REPL_DEPLOYMENT || 
                          process.env.REPLIT_DEPLOYMENT || 
                          (process.env.REPLIT_URL && !process.env.REPLIT_URL.includes('--')));
  
  // In deployment, prioritize /tmp/replitdb
  if (isDeployment) {
    try {
      if (fs.existsSync('/tmp/replitdb')) {
        const dbUrl = fs.readFileSync('/tmp/replitdb', 'utf8').trim();
        console.log('✅ Using DATABASE_URL from /tmp/replitdb (deployment)');
        return dbUrl;
      }
    } catch (error) {
      console.warn('⚠️ Could not read /tmp/replitdb in deployment:', error);
    }
  }
  
  // Fallback to environment variable (preview/development)
  if (process.env.DATABASE_URL) {
    console.log('✅ Using DATABASE_URL from environment (preview/development)');
    return process.env.DATABASE_URL;
  }
  
  throw new Error(
    "DATABASE_URL must be set. Check environment variables or /tmp/replitdb file.",
  );
}

const databaseUrl = getDatabaseUrl();
export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
