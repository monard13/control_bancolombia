import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import csurf from 'csurf';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'style-src': ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      'font-src': ["'self'", 'fonts.gstatic.com'],
      'script-src': ["'self'", "'unsafe-inline'"], // Eliminamos replit.com ya que no es necesario en producción
    },
  },
});

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

export const csrfProtection = csurf({ cookie: true });
