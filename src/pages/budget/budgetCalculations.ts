import dayjs from 'dayjs';
import {Budget, BudgetProgress, Expense, MonthYear} from '../../Types';
import {isEmpty} from '../../utility/utility';

export const filterExpensesByMonth = (
  expenses: Expense[],
  monthYear: MonthYear,
): Expense[] => {
  return expenses.filter(expense => {
    const d = dayjs(new Date(expense.date));
    return d.year() === monthYear.year && d.month() === monthYear.month;
  });
};

export const calculateBudgetProgress = (
  expenses: Expense[],
  budgets: Budget[],
): BudgetProgress[] => {
  return budgets.map(budget => {
    let spent: number;
    if (budget.tagList.includes('All')) {
      spent = expenses.filter(e => e.costType === 'debit').reduce((s, e) => s + e.cost, 0);
    } else {
      spent = expenses
        .filter(e => !isEmpty(e.tag))
        .filter(e => e.costType === 'debit')
        .filter(e => budget.tagList.some(tag => e.tag?.toLowerCase() === tag.toLowerCase()))
        .reduce((s, e) => s + e.cost, 0);
    }
    return {
      budget,
      spent,
      remaining: Math.max(0, budget.amount - spent),
      percentage: (spent / budget.amount) * 100,
    };
  });
};
