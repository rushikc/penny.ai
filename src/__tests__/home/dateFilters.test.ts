import dayjs from 'dayjs';
import {
  createMonthYear,
  filterExpensesByDate,
  filterExpensesByHomeDateFilter,
  filterExpensesByMonthYear,
  getCurrentMonthYear,
  getDefaultHomeDateFilter,
  getHomeDateFilterLabel,
  relativeFilterOptions,
} from '../../pages/dataValidations';
import {makeExpense, ms} from '../fixtures/factories';

describe('month year helpers', () => {
  it('creates padded month-year values and labels', () => {
    expect(createMonthYear(0, 2026)).toEqual({
      month: 0,
      year: 2026,
      label: 'Jan 2026',
      value: '2026-01',
    });
    expect(createMonthYear(10, 2025).value).toBe('2025-11');
  });

  it('returns the current month/year', () => {
    const now = dayjs();
    const current = getCurrentMonthYear();
    expect(current.month).toBe(now.month());
    expect(current.year).toBe(now.year());
  });

  it('defaults home filter to current month mode', () => {
    const filter = getDefaultHomeDateFilter();
    expect(filter.mode).toBe('month');
    if (filter.mode === 'month') {
      expect(filter.monthYear).toEqual(getCurrentMonthYear());
    }
  });

  it('labels month and relative filters', () => {
    expect(getHomeDateFilterLabel({mode: 'month', monthYear: createMonthYear(5, 2026)})).toBe(
      'Jun 2026',
    );
    expect(getHomeDateFilterLabel({mode: 'relative', range: '7d'})).toBe('Last 7 Days');
    expect(relativeFilterOptions.map(o => o.id)).toEqual(['7d', '14d', '30d']);
  });
});

describe('filterExpensesByMonthYear', () => {
  const expenses = [
    makeExpense({id: 'a', mailId: 'a', date: ms(2026, 6, 1)}),
    makeExpense({id: 'b', mailId: 'b', date: ms(2026, 5, 31)}),
    makeExpense({id: 'c', mailId: 'c', date: ms(2026, 6, 30)}),
  ];

  it('returns empty for empty input', () => {
    expect(filterExpensesByMonthYear([], createMonthYear(5, 2026))).toEqual([]);
  });

  it('keeps only expenses in the selected month', () => {
    const filtered = filterExpensesByMonthYear(expenses, createMonthYear(5, 2026));
    expect(filtered.map(e => e.id)).toEqual(['a', 'c']);
  });
});

describe('filterExpensesByDate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 5, 15, 12));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const expenses = [
    makeExpense({id: 'today', mailId: 'today', date: ms(2026, 6, 15)}),
    makeExpense({id: 'week', mailId: 'week', date: ms(2026, 6, 10)}),
    makeExpense({id: 'month', mailId: 'month', date: ms(2026, 5, 20)}),
    makeExpense({id: 'old', mailId: 'old', date: ms(2024, 1, 1)}),
  ];

  it('returns empty for empty input', () => {
    expect(filterExpensesByDate([], '7d')).toEqual([]);
  });

  it.each([
    ['1d', ['today']],
    ['7d', ['today', 'week']],
    ['30d', ['today', 'week', 'month']],
  ] as const)('filters %s range', (range, expectedIds) => {
    expect(filterExpensesByDate(expenses, range).map(e => e.id)).toEqual(expectedIds);
  });

  it('includes old expenses for all-time style ranges', () => {
    const ids = filterExpensesByDate(expenses, '1800d').map(e => e.id);
    expect(ids).toContain('old');
    expect(ids).toHaveLength(4);
  });
});

describe('filterExpensesByHomeDateFilter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 5, 15, 12));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const expenses = [
    makeExpense({id: 'jun', mailId: 'jun', date: ms(2026, 6, 2)}),
    makeExpense({id: 'recent', mailId: 'recent', date: ms(2026, 6, 12)}),
    makeExpense({id: 'may', mailId: 'may', date: ms(2026, 5, 1)}),
  ];

  it('supports month mode', () => {
    const filtered = filterExpensesByHomeDateFilter(expenses, {
      mode: 'month',
      monthYear: createMonthYear(5, 2026),
    });
    expect(filtered.map(e => e.id)).toEqual(['jun', 'recent']);
  });

  it('supports relative mode', () => {
    const filtered = filterExpensesByHomeDateFilter(expenses, {
      mode: 'relative',
      range: '7d',
    });
    expect(filtered.map(e => e.id)).toEqual(['recent']);
  });
});
