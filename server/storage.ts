import { users, transactions, type User, type InsertUser, type Transaction, type InsertTransaction } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, ilike, sql, sum } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values({
        ...insertTransaction,
        reconciled: insertTransaction.reconciled ?? false,
        date: insertTransaction.date ? new Date(insertTransaction.date) : new Date(),
      })
      .returning();
    return transaction;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async getTransactions(filters?: {
    type?: 'income' | 'expense';
    search?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]> {
    const whereConditions = [];

    if (filters?.type) {
      whereConditions.push(eq(transactions.type, filters.type));
    }

    if (filters?.search) {
      whereConditions.push(ilike(transactions.description, `%${filters.search}%`));
    }

    if (filters?.startDate) {
      whereConditions.push(gte(transactions.date, filters.startDate));
    }

    if (filters?.endDate) {
      whereConditions.push(lte(transactions.date, filters.endDate));
    }

    const baseQuery = db.select().from(transactions);
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    const queryWithWhere = whereClause ? baseQuery.where(whereClause) : baseQuery;
    const queryWithOrder = queryWithWhere.orderBy(desc(transactions.date));
    
    let finalQuery = queryWithOrder;
    
    if (filters?.offset) {
      finalQuery = finalQuery.offset(filters.offset);
    }

    if (filters?.limit) {
      finalQuery = finalQuery.limit(filters.limit);
    }

    return await finalQuery;
  }

  async updateTransaction(id: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    if (updates.date) {
      updateData.date = new Date(updates.date);
    }

    const [transaction] = await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .returning();

    return transaction || undefined;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getTransactionsSummary(): Promise<{
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    transactionCount: number;
  }> {
    const allTransactions = await db.select().from(transactions);
    
    let totalBalance = 0;
    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    allTransactions.forEach(t => {
      const amount = parseFloat(t.amount);
      if (t.type === 'income') {
        totalBalance += amount;
        monthlyIncome += amount;
      } else {
        totalBalance -= amount;
        monthlyExpenses += amount;
      }
    });

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      transactionCount: allTransactions.length,
    };
  }
}

export const storage = new DatabaseStorage();
