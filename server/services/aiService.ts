import OpenAI from "openai";
import { ExtractedData } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export class AIService {
  async extractTransactionData(ocrText: string): Promise<ExtractedData> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are an expert at extracting financial transaction data from receipt text. 
            Analyze the OCR text and extract transaction information. 
            
            Categories available:
            - Income: salary, freelance, investment, other-income
            - Expenses: food, transport, utilities, entertainment, healthcare, other-expense
            
            Respond with JSON in this exact format:
            {
              "amount": number,
              "description": string,
              "category": string,
              "date": "YYYY-MM-DD",
              "vendor": string,
              "confidence": number (0-1)
            }
            
            If you cannot extract certain fields, use null. 
            Set confidence based on how clear the information is in the text.
            For Spanish receipts, translate descriptions to Spanish.`
          },
          {
            role: "user",
            content: `Extract transaction data from this receipt text: ${ocrText}`
          }
        ],
        response_format: { type: "json_object" },
      });

      const extractedData = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        amount: extractedData.amount || null,
        description: extractedData.description || '',
        category: this.mapToValidCategory(extractedData.category),
        date: extractedData.date || null,
        vendor: extractedData.vendor || '',
        confidence: Math.max(0, Math.min(1, extractedData.confidence || 0)),
        rawText: ocrText
      };
    } catch (error) {
      console.error('AI processing error:', error);
      throw new Error('Failed to process receipt data with AI');
    }
  }

  private mapToValidCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'food': 'food',
      'alimentacion': 'food',
      'comida': 'food',
      'supermercado': 'food',
      'restaurant': 'food',
      'transport': 'transport',
      'transporte': 'transport',
      'gasolina': 'transport',
      'gas': 'transport',
      'combustible': 'transport',
      'taxi': 'transport',
      'utilities': 'utilities',
      'servicios': 'utilities',
      'electricity': 'utilities',
      'water': 'utilities',
      'internet': 'utilities',
      'phone': 'utilities',
      'entertainment': 'entertainment',
      'entretenimiento': 'entertainment',
      'cine': 'entertainment',
      'healthcare': 'healthcare',
      'salud': 'healthcare',
      'medical': 'healthcare',
      'pharmacy': 'healthcare',
      'salary': 'salary',
      'salario': 'salary',
      'sueldo': 'salary',
      'freelance': 'freelance',
      'investment': 'investment',
      'inversion': 'investment'
    };

    const normalizedCategory = category?.toLowerCase() || '';
    return categoryMap[normalizedCategory] || 'other-expense';
  }
}

export const aiService = new AIService();
