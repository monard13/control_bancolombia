import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // 'admin', 'user'
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Foreign key to users table
  type: text("type").notNull(), // 'income' or 'expense'
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  receiptUrl: text("receipt_url"),
  extractedData: jsonb("extracted_data"), // OCR and AI extracted data
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // AI confidence score 0-1
  reconciled: boolean("reconciled").notNull().default(false), // Reconciliation status
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Define relations for better type safety and joins
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
}).extend({
  role: z.enum(['admin', 'user']).default('user'),
});

export const loginSchema = z.object({
  email: z.string().email("Por favor ingrese un correo electrónico válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const insertTransactionSchema = createInsertSchema(transactions)
  .pick({
    type: true,
    amount: true,
    description: true,
    date: true,
    receiptUrl: true,
    extractedData: true,
    confidence: true,
    reconciled: true,
  })
  .extend({
    // Accept both Spanish labels and internal values; normalize to 'income' | 'expense'
    type: z
      .union([
        z.enum(['income', 'expense']),
        z.enum(['INGRESO', 'EGRESO']),
      ])
      .transform((val) =>
        val === 'INGRESO' || val === 'income' ? 'income' : 'expense'
      ),
    date: z
      .union([
        z.string().transform((val) => new Date(val)),
        z.date(),
      ])
      .optional(),
  });

export const transactionFilterSchema = z.object({
  type: z.enum(['income', 'expense', 'all']).optional(),
  search: z.string().optional(),
  period: z.enum(['week', 'month', 'quarter', 'year', 'all']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;
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
