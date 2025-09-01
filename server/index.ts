import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { limiter, csrfProtection, securityHeaders } from "./middleware/security";

const app = express();

// Aplicar medidas de seguridad
app.use(securityHeaders);
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Aplicar CSRF protection a todas las rutas /api
app.use('/api', csrfProtection);

import { config } from "./config";

console.log(`🌍 Environment: ${config.isProduction ? 'production' : 'development'}, Deployment: ${config.isDeployment}, HTTPS: ${config.isHTTPS}`);

app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.isHTTPS,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: config.isDeployment ? 'none' : 'lax',
    domain: undefined, // Let browser set automatically
  },
  name: 'financetracker.sid',
}));

// Validar variables de entorno
import { validateEnv } from './utils/validation';
validateEnv();

// Importar el logger personalizado
import { log } from './utils/logger';

// Request logging con el nuevo logger
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log.info(`${req.method} ${path} ${res.statusCode}`, {
        duration,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    }
  });
  next();
});

(async () => {
  // Initialize predefined accounts
  const { initializePredefinedAccounts } = await import("./storage");
  await initializePredefinedAccounts();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log.info(`Server started on port ${port}`);
  });// Final version
})();
