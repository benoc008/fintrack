import { format } from 'date-fns';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  type: 'income' | 'expense' | 'investment';
  account: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}

export interface RetirementPlan {
  currentAge: number;
  retirementAge: number;
  monthlyContribution: number;
  expectedReturn: number;
  targetMonthlyIncome: number;
}

export interface FinancialState {
  version: string;
  lastUpdated: string;
  transactions: Transaction[];
  goals: SavingsGoal[];
  retirement: RetirementPlan;
  accounts: string[];
  customCategories: string[];
}

export const INITIAL_STATE: FinancialState = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  transactions: [],
  goals: [],
  retirement: {
    currentAge: 30,
    retirementAge: 65,
    monthlyContribution: 500,
    expectedReturn: 7,
    targetMonthlyIncome: 3000,
  },
  accounts: [],
  customCategories: [],
};

export const DEFAULT_CATEGORIES = [
  'Housing',
  'Food',
  'Transport',
  'Utilities',
  'Insurance',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Travel',
  'Investment',
  'Salary',
  'Other',
];
