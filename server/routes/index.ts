import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { cacheMiddleware, clearCachePattern } from '../middleware/cache';
import { paginationSchema } from '../utils/validation';
import { 
  insertTransactionSchema, 
  transactionFilterSchema, 
  loginSchema 
} from '@shared/schema';
import { ValidationError } from '../middleware/error-handler';
import { log } from '../utils/logger';

export function createTransactionRouter(storage: any) {
  const router = Router();

  // Ruta para obtener el resumen de transacciones (con caché)
  router.get('/summary', 
    requireAuth,
    cacheMiddleware({ ttl: 300, key: req => `summary-${req.session.userId}` }),
    async (req, res, next) => {
      try {
        const summary = await storage.getTransactionSummary(req.session.userId);
        res.json(summary);
      } catch (error) {
        next(error);
      }
    }
  );

  // Ruta para obtener transacciones con filtros y paginación
  router.get('/',
    requireAuth,
    validate(transactionFilterSchema.merge(paginationSchema)),
    async (req, res, next) => {
      try {
        const { page, limit, ...filters } = req.query;
        const transactions = await storage.getTransactions(
          req.session.userId,
          filters,
          { page: Number(page), limit: Number(limit) }
        );
        res.json(transactions);
      } catch (error) {
        next(error);
      }
    }
  );

  // Ruta para crear una nueva transacción
  router.post('/',
    requireAuth,
    validate(insertTransactionSchema),
    async (req, res, next) => {
      try {
        const transaction = await storage.createTransaction({
          ...req.body,
          userId: req.session.userId
        });
        
        // Limpiar caché relacionada
        clearCachePattern(`summary-${req.session.userId}`);
        
        log.info('Nueva transacción creada', { transactionId: transaction.id });
        res.status(201).json(transaction);
      } catch (error) {
        next(error);
      }
    }
  );

  // Ruta para eliminar una transacción
  router.delete('/:id',
    requireAuth,
    async (req, res, next) => {
      try {
        const transaction = await storage.getTransaction(req.params.id);
        
        if (!transaction) {
          throw new ValidationError('Transacción no encontrada');
        }
        
        if (transaction.userId !== req.session.userId && req.session.userRole !== 'admin') {
          throw new ValidationError('No tienes permiso para eliminar esta transacción');
        }
        
        await storage.deleteTransaction(req.params.id);
        
        // Limpiar caché relacionada
        clearCachePattern(`summary-${req.session.userId}`);
        
        log.info('Transacción eliminada', { transactionId: req.params.id });
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

export function createAuthRouter(storage: any) {
  const router = Router();

  router.post('/login',
    validate(loginSchema),
    async (req, res, next) => {
      try {
        const { email, password } = req.body;
        const user = await storage.authenticateUser(email, password);
        
        if (user) {
          req.session.userId = user.id;
          req.session.userRole = user.role;
          log.info('Usuario autenticado', { userId: user.id });
          res.json({ user });
        } else {
          throw new ValidationError('Credenciales inválidas');
        }
      } catch (error) {
        next(error);
      }
    }
  );

  router.post('/logout',
    (req, res) => {
      req.session.destroy(() => {
        res.status(204).send();
      });
    }
  );

  return router;
}
