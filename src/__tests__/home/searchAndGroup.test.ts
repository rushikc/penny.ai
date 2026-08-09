import {
  groupByOptions,
  groupExpenses,
  searchExpenses,
  sortByOptions,
} from '../../pages/dataValidations';
import {makeExpense, ms} from '../fixtures/factories';

describe('searchExpenses', () => {
  const expenses = [
    makeExpense({id: '1', mailId: '1', vendor: 'Swiggy', tag: 'Food', cost: 250}),
    makeExpense({id: '2', mailId: '2', vendor: 'Amazon', tag: 'Shopping', cost: 1200}),
    makeExpense({id: '3', mailId: '3', vendor: 'Uber', cost: 80, tag: undefined}),
  ];

  it('returns all expenses for blank search', () => {
    expect(searchExpenses(expenses, '   ')).toEqual(expenses);
  });

  it('matches vendor case-insensitively', () => {
    expect(searchExpenses(expenses, 'swig').map(e => e.id)).toEqual(['1']);
  });

  it('matches cost substring', () => {
    expect(searchExpenses(expenses, '1200').map(e => e.id)).toEqual(['2']);
  });

  it('matches tag and ignores untagged when searching tags', () => {
    expect(searchExpenses(expenses, 'food').map(e => e.id)).toEqual(['1']);
    expect(searchExpenses(expenses, 'missing')).toEqual([]);
  });
});

describe('groupExpenses', () => {
  const expenses = [
    makeExpense({
      id: '1',
      mailId: '1',
      vendor: 'Swiggy',
      tag: 'Food',
      cost: 50,
      costType: 'debit',
      date: ms(2026, 6, 1),
    }),
    makeExpense({
      id: '2',
      mailId: '2',
      vendor: 'SWIGGY',
      tag: 'Food',
      cost: 150,
      costType: 'credit',
      date: ms(2026, 6, 1),
    }),
    makeExpense({
      id: '3',
      mailId: '3',
      vendor: 'Amazon',
      tag: undefined,
      cost: 600,
      costType: 'debit',
      date: ms(2026, 6, 2),
    }),
    makeExpense({
      id: '4',
      mailId: '4',
      vendor: 'BigBazaar',
      tag: 'Groceries',
      cost: 1500,
      costType: 'debit',
      date: ms(2026, 6, 3),
    }),
  ];

  it('returns empty object for empty list', () => {
    expect(groupExpenses([], 'days')).toEqual({});
  });

  it('groups by days with signed totals', () => {
    const grouped = groupExpenses(expenses, 'days');
    expect(Object.keys(grouped)).toHaveLength(3);
    expect(grouped['2026-06-01'].totalAmount).toBe(-50 + 150);
  });

  it('groups by vendor case-insensitively', () => {
    const grouped = groupExpenses(expenses, 'vendor');
    expect(grouped.swiggy.expenses).toHaveLength(2);
    expect(grouped.amazon.expenses).toHaveLength(1);
  });

  it('groups by tags including untagged', () => {
    const grouped = groupExpenses(expenses, 'tags');
    expect(grouped.food.expenses).toHaveLength(2);
    expect(grouped.untagged.groupLabel).toBe('Untagged');
  });

  it('groups by cost bands', () => {
    const grouped = groupExpenses(expenses, 'cost');
    expect(grouped.range_0_100.expenses.map(e => e.id)).toEqual(['1']);
    expect(grouped.range_100_500.expenses.map(e => e.id)).toEqual(['2']);
    expect(grouped.range_500_1000.expenses.map(e => e.id)).toEqual(['3']);
    expect(grouped.range_1000_plus.expenses.map(e => e.id)).toEqual(['4']);
  });

  it('exposes group/sort option catalogs', () => {
    expect(groupByOptions.map(o => o.id)).toEqual(['days', 'vendor', 'tags', 'cost']);
    expect(sortByOptions.map(o => o.id)).toEqual(['cost', 'count']);
  });
});

describe('sort grouped expense keys', () => {
  const grouped = groupExpenses(
    [
      makeExpense({id: 'a', mailId: 'a', vendor: 'A', cost: 10, date: ms(2026, 6, 1)}),
      makeExpense({id: 'b', mailId: 'b', vendor: 'B', cost: 50, date: ms(2026, 6, 2)}),
      makeExpense({id: 'c', mailId: 'c', vendor: 'B', cost: 5, date: ms(2026, 6, 2)}),
    ],
    'vendor',
  );

  it('sorts by total cost descending', () => {
    const keys = Object.entries(grouped)
      .sort(([, a], [, b]) => b.totalAmount - a.totalAmount)
      .map(([key]) => key);
    expect(keys[0]).toBe('a');
  });

  it('sorts by expense count descending', () => {
    const keys = Object.entries(grouped)
      .sort(([, a], [, b]) => b.expenses.length - a.expenses.length)
      .map(([key]) => key);
    expect(keys[0]).toBe('b');
  });
});

describe('days group date-key sorting', () => {
  it('sorts YYYY-MM-DD keys descending when sortBy is null or date', () => {
    const grouped = groupExpenses(
      [
        makeExpense({id: 'a', mailId: 'a', date: ms(2026, 6, 1)}),
        makeExpense({id: 'b', mailId: 'b', date: ms(2026, 6, 3)}),
        makeExpense({id: 'c', mailId: 'c', date: ms(2026, 6, 2)}),
      ],
      'days',
    );

    const sortDays = () =>
      Object.entries(grouped)
        .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
        .map(([key]) => key);

    expect(sortDays()).toEqual(['2026-06-03', '2026-06-02', '2026-06-01']);
  });
});
