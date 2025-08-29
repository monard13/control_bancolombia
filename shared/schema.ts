import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'income' or 'expense'
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  receiptUrl: text("receipt_url"),
  extractedData: jsonb("extracted_data"), // OCR and AI extracted data
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // AI confidence score 0-1
  reconciled: boolean("reconciled").notNull().default(false), // Reconciliation status
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  type: true,
  amount: true,
  description: true,
  category: true,
  date: true,
  receiptUrl: true,
  extractedData: true,
  confidence: true,
  reconciled: true,
}).extend({
  type: z.enum(['income', 'expense']),
  category: z.enum(['INGRESO', 'EGRESO']),
  date: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

export const transactionFilterSchema = z.object({
  type: z.enum(['income', 'expense', 'all']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  period: z.enum(['week', 'month', 'quarter', 'year', 'all']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type TransactionFilter = z.infer<typeof transactionFilterSchema>;

// OCR and AI response types
export type ExtractedData = {
  amount?: number;
  description?: string;
  category?: string;
  date?: string;
  vendor?: string;
  confidence: number;
  rawText: string;
};
