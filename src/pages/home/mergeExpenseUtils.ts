import {Expense} from '../../Types';

export const calculateMergeTotal = (expenses: Expense[]): number =>
  expenses.reduce((sum, exp) => sum + (exp.costType === 'debit' ? -exp.cost : exp.cost), 0);

export const buildMergedExpense = (
  expenses: Expense[],
  selectedVendor: string,
  selectedTag: string,
  nowMs: number = Date.now(),
): Expense => {
  const totalCost = calculateMergeTotal(expenses);
  const vendorExpense = expenses.find(exp => exp.vendor === selectedVendor) || expenses[0];

  return {
    id: vendorExpense.id,
    vendor: selectedVendor,
    tag: selectedTag || vendorExpense.tag,
    cost: Math.abs(totalCost),
    date: vendorExpense.date,
    modifiedDate: nowMs,
    costType: totalCost < 0 ? 'debit' : 'credit',
    mailId: vendorExpense.mailId,
    user: vendorExpense.user,
    type: vendorExpense.type,
    operation: 'merged',
  };
};

export const uniqueVendorsFromExpenses = (expenses: Expense[]): string[] =>
  Array.from(new Set(expenses.map(exp => exp.vendor)));
