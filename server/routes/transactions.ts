import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { insertTransactionSchema, transactionFilterSchema } from '@shared/schema';

/**
 * @swagger
 * tags:
 *   - name: Transactions
 *     description: API endpoints for managing transactions
 * 
 * components:
 *   parameters:
 *     transactionId:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *       description: ID of the transaction
 */

export function createTransactionRoutes() {
  const router = Router();

  /**
   * @swagger
   * /api/transactions:
   *   get:
   *     summary: Get all transactions
   *     tags: [Transactions]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [income, expense, all]
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: List of transactions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Transaction'
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  router.get('/', requireAuth, validate(transactionFilterSchema), async (req, res) => {
    // Implementación...
  });

  /**
   * @swagger
   * /api/transactions:
   *   post:
   *     summary: Create a new transaction
   *     tags: [Transactions]
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Transaction'
   *     responses:
   *       201:
   *         description: Transaction created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Transaction'
   *       400:
   *         description: Invalid input
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  router.post('/', requireAuth, validate(insertTransactionSchema), async (req, res) => {
    // Implementación...
  });

  /**
   * @swagger
   * /api/transactions/summary:
   *   get:
   *     summary: Get transaction summary
   *     tags: [Transactions]
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Transaction summary
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TransactionSummary'
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  router.get('/summary', requireAuth, async (req, res) => {
    // Implementación...
  });

  /**
   * @swagger
   * /api/transactions/{id}:
   *   put:
   *     summary: Update a transaction
   *     tags: [Transactions]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/transactionId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Transaction'
   *     responses:
   *       200:
   *         description: Transaction updated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Transaction'
   *       400:
   *         description: Invalid input
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Transaction not found
   *       500:
   *         description: Server error
   */
  router.put('/:id', requireAdmin, validate(insertTransactionSchema), async (req, res) => {
    // Implementación...
  });

  /**
   * @swagger
   * /api/transactions/{id}:
   *   delete:
   *     summary: Delete a transaction
   *     tags: [Transactions]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/transactionId'
   *     responses:
   *       204:
   *         description: Transaction deleted
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Transaction not found
   *       500:
   *         description: Server error
   */
  router.delete('/:id', requireAdmin, async (req, res) => {
    // Implementación...
  });

  return router;
}
