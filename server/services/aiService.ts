import OpenAI from "openai";
import { ExtractedData } from "@shared/schema";
import { z } from "zod";

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

const ExtractedDataSchema = z.object({
  amount: z.union([z.number(), z.null()]).transform(val => val === null ? undefined : val),
  description: z.string(),
  category: z.string(),
  date: z.union([z.string(), z.null()]).transform(val => val === null ? undefined : val),
  vendor: z.string(),
  confidence: z.number().min(0).max(1),
  rawText: z.string()
}).transform((data): ExtractedData => ({
  ...data,
  amount: data.amount === null ? undefined : data.amount,
  date: data.date === null ? undefined : data.date
}));

class AIService {
  private readonly incomeKeywords = [
    'salary', 'salario', 'sueldo', 'freelance', 
    'investment', 'inversion', 'income', 'ingreso', 
    'pago', 'cobro'
  ];

  private async classifyCategory(text: string): Promise<'INGRESO' | 'EGRESO'> {
    const normalizedText = text.toLowerCase();
    return this.incomeKeywords.some(keyword => normalizedText.includes(keyword))
      ? 'INGRESO'
      : 'EGRESO';
  }

  private async validateData(data: unknown): Promise<ExtractedData> {
    try {
      return ExtractedDataSchema.parse(data);
    } catch (error) {
      console.error('Data validation error:', error);
      throw new Error('Invalid data format received from AI');
    }
  }

  private async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxRetries) {
      try {
        console.log(`Processing attempt ${attempt + 1}/${maxRetries}`);
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Error in attempt ${attempt + 1}:`, lastError.message);
        
        attempt++;
        if (attempt === maxRetries) break;

        const delay = initialDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retrying after ${delay}ms delay`);
      }
    }

    throw lastError || new Error('Maximum retries exceeded');
  }

  async extractTransactionData(ocrText: string): Promise<ExtractedData> {
    return this.retryWithExponentialBackoff(async () => {
      console.log('Starting AI processing for text length:', ocrText.length);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert at extracting financial transaction data from receipt text. 
            Analyze the OCR text and extract transaction information. 
            
            Categories available (use exactly these values):
            - INGRESO (for income/money received)
            - EGRESO (for expenses/money spent)
            
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
        temperature: 0.3,
        max_tokens: 500
      });

      const rawData = JSON.parse(response.choices[0].message.content || '{}');
      const category = await this.classifyCategory(rawData.category || rawData.description || '');
      
      const extractedData = await this.validateData({
        ...rawData,
        category,
        rawText: ocrText
      });

      console.log('Data extracted and validated successfully');
      return extractedData;
    });
  }
}

export const aiService = new AIService();
