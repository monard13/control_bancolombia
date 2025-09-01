import rateLimit from 'express-rate-limit';
import csrf from 'csurf';
import helmet from 'helmet';

// Rate limiting middleware
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 solicitudes por ventana por IP
  message: 'Demasiadas solicitudes desde esta IP, por favor intente de nuevo más tarde.'
});

// CSRF protection middleware
export const csrfProtection = csrf({ 
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: true
  } 
});

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
});
