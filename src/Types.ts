export interface Expense {
  id: string,
  tag?: string,
  mailId: string,
  cost: number,
  //credit or debit type of the transaction, not the card types
  costType: 'credit' | 'debit',
  date: number,
  modifiedDate: number,
  user: string,
  type: string,
  vendor: string,
  operation: string,
}

export interface VendorTag {
  id: string,
  vendor: string,
  tag: string,
  date: number
}


export interface Alert {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface BankConfig {
  enableUpi: boolean;
  creditCards: string[];
}

export interface InvestmentAsset {
  id: string;
  name: string;
  currentValue: number;
  monthlyContribution: number;
  currency: 'INR' | 'USD';
  /** When omitted, projections follow the Expected Return slider. */
  annualReturnRate?: number;
  /** Epoch ms when currentValue / monthlyContribution were last set. */
  asOfDate?: number;
}

export interface InvestmentConfig {
  assets: InvestmentAsset[];
  includeSip: boolean;
  years: number;
  assumedReturnRate: number;
}

export interface Config {
  key: string,
  value: string | number
}

export interface AppConfig {
  darkMode: boolean;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  tagList: string[];
  modifiedDate: number;
  operation?: string;
}

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
}

export type MonthYear = {
  month: number;
  year: number;
  label: string;
  value: string;
};
