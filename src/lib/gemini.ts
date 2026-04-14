import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const transactionSchema = {
  type: Type.OBJECT,
  properties: {
    date: { type: Type.STRING, description: "ISO date string YYYY-MM-DD" },
    description: { type: Type.STRING, description: "Cleaned description of the transaction" },
    amount: { type: Type.NUMBER, description: "Amount (positive for income, negative for expense)" },
    currency: { type: Type.STRING, description: "Currency code (e.g., CHF, EUR, USD)" },
    category: { type: Type.STRING, description: "Category (Housing, Food, Transport, Utilities, Insurance, Healthcare, Entertainment, Shopping, Travel, Investment, Salary, Other)" },
    type: { type: Type.STRING, enum: ["income", "expense", "investment"] },
    account: { type: Type.STRING, description: "Account name or type" }
  },
  required: ["date", "description", "amount", "currency", "category", "type", "account"]
};

export async function processStatement(text: string, useLocalModel: boolean = false): Promise<Transaction[]> {
  if (useLocalModel) {
    return processWithOllama(text);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Extract all transactions from the following bank statement text. 
      Standardize the data into the requested JSON format. 
      If a transaction is an expense, the amount should be negative. 
      If it's income, it should be positive.
      Identify the currency for each transaction (e.g., CHF, EUR, USD).
      
      Statement Text:
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: transactionSchema
        }
      }
    });

    const result = JSON.parse(response.text || "[]");
    return result.map((t: any) => ({
      ...t,
      id: Math.random().toString(36).substring(2, 11)
    }));
  } catch (error) {
    console.error("Error processing statement with Gemini:", error);
    throw new Error("Failed to process statement with AI");
  }
}

async function processWithOllama(text: string): Promise<Transaction[]> {
  try {
    // This assumes Ollama is running locally on port 11434
    // We use gemma2 as the default local model
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      body: JSON.stringify({
        model: "gemma4",
        prompt: `Extract all transactions from this bank statement text and return ONLY a JSON array.
        CRITICAL: The "date" field MUST be in YYYY-MM-DD format.
        Each object must have: date (YYYY-MM-DD), description, amount (negative for expense, positive for income), currency (CHF, EUR, USD), category, type (income, expense, investment), and account.
        
        Text: ${text}`,
        stream: false,
        format: "json"
      })
    });

    if (!response.ok) throw new Error("Ollama connection failed. Is it running?");
    
    const data = await response.json();
    console.log("Raw Ollama response:", data.response);
    let result = JSON.parse(data.response || "[]");
    
    // Defensive check: if result is an object containing an array, extract the array
    if (!Array.isArray(result) && typeof result === 'object' && result !== null) {
      const arrayKey = Object.keys(result).find(key => Array.isArray((result as any)[key]));
      if (arrayKey) {
        result = (result as any)[arrayKey];
      } else {
        result = [];
      }
    }

    if (!Array.isArray(result)) {
      result = [];
    }
    
    return result.map((t: any) => ({
      ...t,
      // Normalize date format (e.g., DD.MM.YYYY to YYYY-MM-DD)
      date: normalizeDate(t.date),
      id: Math.random().toString(36).substring(2, 11)
    }));
  } catch (error) {
    console.error("Error processing with Ollama:", error);
    throw new Error("Local model (Ollama) failed. Make sure Ollama is running with the correct model.");
  }
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  // Handle DD.MM.YYYY
  const dotMatch = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dotMatch) {
    return `${dotMatch[3]}-${dotMatch[2]}-${dotMatch[1]}`;
  }
  
  // Handle DD/MM/YYYY
  const slashMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`;
  }

  // If it's already YYYY-MM-DD or something else, try to parse it
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return dateStr; // Fallback
}
