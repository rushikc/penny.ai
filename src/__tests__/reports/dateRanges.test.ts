import {
  calculationOptions,
  filterExpensesByDate,
  filterOptions,
  groupByOptions,
} from '../../pages/dataValidations';
import {makeExpense, ms} from '../fixtures/factories';

describe('reports date range filters', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 5, 15, 12));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const expenses = [
    makeExpense({id: '1d', mailId: '1d', date: ms(2026, 6, 15)}),
    makeExpense({id: '7d', mailId: '7d', date: ms(2026, 6, 10)}),
    makeExpense({id: '14d', mailId: '14d', date: ms(2026, 6, 5)}),
    makeExpense({id: '30d', mailId: '30d', date: ms(2026, 5, 20)}),
    makeExpense({id: '60d', mailId: '60d', date: ms(2026, 4, 20)}),
    makeExpense({id: '90d', mailId: '90d', date: ms(2026, 3, 20)}),
    makeExpense({id: '180d', mailId: '180d', date: ms(2025, 12, 20)}),
    makeExpense({id: '366d', mailId: '366d', date: ms(2025, 6, 20)}),
    makeExpense({id: '732d', mailId: '732d', date: ms(2024, 7, 1)}),
    makeExpense({id: '1800d', mailId: '1800d', date: ms(2022, 1, 1)}),
  ];

  it('exposes the full reports filter catalog', () => {
    expect(filterOptions.map(o => o.id)).toEqual([
      '1d',
      '7d',
      '14d',
      '30d',
      '60d',
      '90d',
      '180d',
      '366d',
      '732d',
      '1800d',
    ]);
    expect(groupByOptions.map(o => o.id)).toEqual(['days', 'vendor', 'tags', 'cost']);
    expect(calculationOptions.map(o => o.id)).toEqual(['average', 'median']);
  });

  it.each([
    ['1d', 1],
    ['7d', 2],
    ['14d', 3],
    ['30d', 4],
    ['60d', 5],
    ['90d', 6],
    ['180d', 7],
    ['366d', 8],
    ['732d', 9],
    ['1800d', 10],
  ] as const)('includes expected count for %s', (range, count) => {
    expect(filterExpensesByDate(expenses, range)).toHaveLength(count);
  });
});
