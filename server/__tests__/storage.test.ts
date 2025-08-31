import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { storage } from '../storage';
import { ValidationError } from '../middleware/error-handler';

// Mock de la base de datos
jest.mock('../db', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}));

describe('Storage Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Transaction Operations', () => {
    const mockTransaction = {
      id: '123',
      type: 'expense',
      amount: 100,
      description: 'Test transaction',
      date: new Date(),
      userId: 'user123'
    };

    it('should create a transaction', async () => {
      // @ts-ignore - Mock implementation
      storage.db.insert.mockResolvedValue([mockTransaction]);

      const result = await storage.createTransaction({
        type: 'expense',
        amount: 100,
        description: 'Test transaction',
        userId: 'user123'
      });

      expect(result).toEqual(mockTransaction);
      expect(storage.db.insert).toHaveBeenCalled();
    });

    it('should get transactions with filters', async () => {
      // @ts-ignore - Mock implementation
      storage.db.select.mockResolvedValue([mockTransaction]);

      const result = await storage.getTransactions('user123', {
        type: 'expense',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString()
      });

      expect(result).toEqual([mockTransaction]);
      expect(storage.db.select).toHaveBeenCalled();
    });

    it('should update a transaction', async () => {
      // @ts-ignore - Mock implementation
      storage.db.update.mockResolvedValue([{ ...mockTransaction, amount: 200 }]);

      const result = await storage.updateTransaction('123', {
        amount: 200
      });

      expect(result.amount).toBe(200);
      expect(storage.db.update).toHaveBeenCalled();
    });

    it('should delete a transaction', async () => {
      // @ts-ignore - Mock implementation
      storage.db.delete.mockResolvedValue([mockTransaction]);

      const result = await storage.deleteTransaction('123');

      expect(result).toBeTruthy();
      expect(storage.db.delete).toHaveBeenCalled();
    });

    it('should validate transaction amount', async () => {
      await expect(storage.createTransaction({
        type: 'expense',
        amount: -100, // amount no puede ser negativo
        description: 'Test transaction',
        userId: 'user123'
      })).rejects.toThrow(ValidationError);
    });
  });

  describe('Transaction Summary', () => {
    const mockTransactions = [
      { type: 'expense', amount: 100 },
      { type: 'income', amount: 200 },
      { type: 'expense', amount: 50 }
    ];

    it('should calculate correct summary', async () => {
      // @ts-ignore - Mock implementation
      storage.db.select.mockResolvedValue(mockTransactions);

      const summary = await storage.getTransactionSummary('user123');

      expect(summary).toEqual({
        totalIncome: 200,
        totalExpenses: 150,
        balance: 50
      });
    });
  });
});
