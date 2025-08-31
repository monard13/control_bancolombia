import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';

const cache = new NodeCache({
  stdTTL: 300, // 5 minutos por defecto
  checkperiod: 60, // Checar expiración cada minuto
});

interface CacheOptions {
  ttl?: number;
  key?: string | ((req: Request) => string);
}

export const cacheMiddleware = (options: CacheOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = typeof options.key === 'function'
      ? options.key(req)
      : options.key || req.originalUrl;

    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      return res.send(cachedResponse);
    }

    const originalSend = res.send.bind(res);
    res.send = function(body: any): Response {
      cache.set(key, body, options.ttl || 300);
      return originalSend(body);
    };

    next();
  };
};

export const clearCache = (key: string) => {
  cache.del(key);
};

export const clearCachePattern = (pattern: string) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter((k: string) => k.includes(pattern));
  cache.del(matchingKeys);
};
