import {createMonthYear} from '../../pages/dataValidations';
import {
  calculateBudgetProgress,
  filterExpensesByMonth,
} from '../../pages/budget/budgetCalculations';
import {makeBudget, makeExpense, ms} from '../fixtures/factories';

describe('filterExpensesByMonth', () => {
  it('filters by month and year', () => {
    const expenses = [
      makeExpense({id: '1', mailId: '1', date: ms(2026, 6, 1)}),
      makeExpense({id: '2', mailId: '2', date: ms(2026, 5, 1)}),
    ];
    expect(filterExpensesByMonth(expenses, createMonthYear(5, 2026)).map(e => e.id)).toEqual(['1']);
  });
});

describe('calculateBudgetProgress', () => {
  const expenses = [
    makeExpense({id: '1', mailId: '1', tag: 'Food', cost: 1000, costType: 'debit'}),
    makeExpense({id: '2', mailId: '2', tag: 'food', cost: 500, costType: 'debit'}),
    makeExpense({id: '3', mailId: '3', tag: 'Travel', cost: 800, costType: 'debit'}),
    makeExpense({id: '4', mailId: '4', tag: 'Food', cost: 200, costType: 'credit'}),
    makeExpense({id: '5', mailId: '5', tag: undefined, cost: 300, costType: 'debit'}),
  ];

  it('returns empty progress for empty budgets', () => {
    expect(calculateBudgetProgress(expenses, [])).toEqual([]);
  });

  it('sums only matching debit tags case-insensitively', () => {
    const [progress] = calculateBudgetProgress(expenses, [
      makeBudget({amount: 2000, tagList: ['Food']}),
    ]);
    expect(progress.spent).toBe(1500);
    expect(progress.remaining).toBe(500);
    expect(progress.percentage).toBeCloseTo(75);
  });

  it('excludes untagged expenses from tag-scoped budgets', () => {
    const [progress] = calculateBudgetProgress(expenses, [
      makeBudget({amount: 1000, tagList: ['Travel']}),
    ]);
    expect(progress.spent).toBe(800);
  });

  it('uses all debits for All tag budgets and ignores credits', () => {
    const [progress] = calculateBudgetProgress(expenses, [
      makeBudget({amount: 3000, tagList: ['All']}),
    ]);
    expect(progress.spent).toBe(1000 + 500 + 800 + 300);
  });

  it('clamps remaining at zero and allows over-budget percentage', () => {
    const [progress] = calculateBudgetProgress(expenses, [
      makeBudget({amount: 1000, tagList: ['Food']}),
    ]);
    expect(progress.spent).toBe(1500);
    expect(progress.remaining).toBe(0);
    expect(progress.percentage).toBeCloseTo(150);
  });

  it('handles empty expenses with zero spent', () => {
    const [progress] = calculateBudgetProgress([], [
      makeBudget({amount: 1000, tagList: ['Food']}),
    ]);
    expect(progress.spent).toBe(0);
    expect(progress.remaining).toBe(1000);
    expect(progress.percentage).toBe(0);
  });
});
