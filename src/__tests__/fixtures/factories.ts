import {Budget, Expense, InvestmentAsset, VendorTag} from '../../Types';

const DEFAULT_NOW = new Date('2026-06-15T12:00:00.000Z').getTime();

export const ms = (year: number, month: number, day: number, hour = 12): number =>
  new Date(year, month - 1, day, hour).getTime();

export function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'exp-1',
    mailId: 'mail-1',
    cost: 100,
    costType: 'debit',
    date: DEFAULT_NOW,
    modifiedDate: DEFAULT_NOW,
    user: 'tester',
    type: 'upi',
    vendor: 'Swiggy',
    operation: 'update',
    tag: 'Food',
    ...overrides,
  };
}

export function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'budget-1',
    name: 'Food Budget',
    amount: 5000,
    tagList: ['Food'],
    modifiedDate: DEFAULT_NOW,
    operation: 'update',
    ...overrides,
  };
}

export function makeVendorTag(overrides: Partial<VendorTag> = {}): VendorTag {
  return {
    id: 'vt-1',
    vendor: 'swiggy',
    tag: 'Food',
    date: DEFAULT_NOW,
    ...overrides,
  };
}

export function makeInvestmentAsset(overrides: Partial<InvestmentAsset> = {}): InvestmentAsset {
  return {
    id: 'mf',
    name: 'Mutual Funds',
    currentValue: 100_000,
    monthlyContribution: 10_000,
    currency: 'INR',
    ...overrides,
  };
}

export const FIXED_NOW = DEFAULT_NOW;
