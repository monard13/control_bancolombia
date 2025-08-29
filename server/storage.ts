import { type User, type InsertUser, type Transaction, type InsertTransaction } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactions(filters?: {
    type?: 'income' | 'expense';
    search?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]>;
  updateTransaction(id: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;
  getTransactionsSummary(): Promise<{
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    transactionCount: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private transactions: Map<string, Transaction>;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const now = new Date();
    const transaction: Transaction = {
      id,
      ...insertTransaction,
      reconciled: insertTransaction.reconciled ?? false, // Default to false if not provided
      date: insertTransaction.date ? new Date(insertTransaction.date) : now,
      receiptUrl: insertTransaction.receiptUrl ?? null, // Ensure null instead of undefined
      extractedData: insertTransaction.extractedData ?? null, // Ensure proper type
      confidence: insertTransaction.confidence ?? null, // Ensure proper type
      createdAt: now,
      updatedAt: now,
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactions(filters?: {
    type?: 'income' | 'expense';
    search?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]> {
    let result = Array.from(this.transactions.values());

    if (filters?.type) {
      result = result.filter(t => t.type === filters.type);
    }


    if (filters?.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(search)
      );
    }

    if (filters?.startDate) {
      result = result.filter(t => t.date >= filters.startDate!);
    }

    if (filters?.endDate) {
      result = result.filter(t => t.date <= filters.endDate!);
    }

    // Sort by date descending
    result.sort((a, b) => b.date.getTime() - a.date.getTime());

    if (filters?.offset) {
      result = result.slice(filters.offset);
    }

    if (filters?.limit) {
      result = result.slice(0, filters.limit);
    }

    return result;
  }

  async updateTransaction(id: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;

    const updated: Transaction = {
      ...transaction,
      ...updates,
      // Handle boolean fields explicitly
      reconciled: updates.reconciled !== undefined ? updates.reconciled : transaction.reconciled,
      date: updates.date ? new Date(updates.date) : transaction.date,
      updatedAt: new Date(),
    };

    this.transactions.set(id, updated);
    return updated;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.transactions.delete(id);
  }

  async getTransactionsSummary(): Promise<{
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    transactionCount: number;
  }> {
    const transactions = Array.from(this.transactions.values());
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let totalBalance = 0;
    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    transactions.forEach(t => {
      const amount = parseFloat(t.amount);
      if (t.type === 'income') {
        totalBalance += amount;
        if (t.date >= startOfMonth) {
          monthlyIncome += amount;
        }
      } else {
        totalBalance -= amount;
        if (t.date >= startOfMonth) {
          monthlyExpenses += amount;
        }
      }
    });

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      transactionCount: transactions.length,
    };
  }
}

export const storage = new MemStorage();
