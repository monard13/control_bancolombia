// Centralized environment configuration
export const config = {
  isProduction: process.env.NODE_ENV === 'production',
  isDeployment: !!(process.env.REPL_DEPLOYMENT || 
                  process.env.REPLIT_DEPLOYMENT || 
                  (process.env.REPLIT_URL && !process.env.REPLIT_URL.includes('--'))),
  isHTTPS: !!(process.env.REPLIT_URL && process.env.REPLIT_URL.startsWith('https://')),
  port: parseInt(process.env.PORT || '5000', 10),
  sessionSecret: process.env.SESSION_SECRET || 'finance-tracker-secret-key-2024'
};

export const getDatabaseUrl = (): string => {
  // In deployment, prioritize /tmp/replitdb
  if (config.isDeployment) {
    try {
      const fs = require('fs');
      if (fs.existsSync('/tmp/replitdb')) {
        const dbUrl = fs.readFileSync('/tmp/replitdb', 'utf8').trim();
        console.log('✅ Using DATABASE_URL from /tmp/replitdb (deployment)');
        return dbUrl;
      }
    } catch (error) {
      console.warn('⚠️ Could not read /tmp/replitdb in deployment:', error);
    }
  }
  
  // Fallback to environment variable
  if (process.env.DATABASE_URL) {
    console.log('✅ Using DATABASE_URL from environment (preview/development)');
    return process.env.DATABASE_URL;
  }
  
  throw new Error('DATABASE_URL must be set. Check environment variables or /tmp/replitdb file.');
};
