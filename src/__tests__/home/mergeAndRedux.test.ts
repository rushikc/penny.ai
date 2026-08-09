import {expenseSlice} from '../../store/expenseSlice';
import {
  buildMergedExpense,
  calculateMergeTotal,
  uniqueVendorsFromExpenses,
} from '../../pages/home/mergeExpenseUtils';
import {makeExpense, makeVendorTag, ms} from '../fixtures/factories';
import {FinanceStorage} from '../../api/FinanceStorage';

jest.mock('../../api/FinanceStorage', () => ({
  FinanceStorage: {
    addVendorTag: jest.fn(() => Promise.resolve()),
  },
}));

const {actions, reducer} = expenseSlice;

describe('merge expense utils', () => {
  const expenses = [
    makeExpense({
      id: '1',
      mailId: '1',
      vendor: 'Swiggy',
      cost: 100,
      costType: 'debit',
      tag: 'Food',
      date: ms(2026, 6, 1),
    }),
    makeExpense({
      id: '2',
      mailId: '2',
      vendor: 'Zomato',
      cost: 40,
      costType: 'credit',
      tag: 'Food',
      date: ms(2026, 6, 2),
    }),
  ];

  it('calculates signed merge total', () => {
    expect(calculateMergeTotal(expenses)).toBe(-60);
  });

  it('builds a debit merged expense from negative total', () => {
    const merged = buildMergedExpense(expenses, 'Swiggy', 'Dining', ms(2026, 6, 15));
    expect(merged).toMatchObject({
      vendor: 'Swiggy',
      tag: 'Dining',
      cost: 60,
      costType: 'debit',
      operation: 'merged',
      mailId: '1',
    });
  });

  it('falls back to original tag and first expense vendor metadata', () => {
    const merged = buildMergedExpense(expenses, 'Missing', '', ms(2026, 6, 15));
    expect(merged.vendor).toBe('Missing');
    expect(merged.tag).toBe('Food');
    expect(merged.mailId).toBe('1');
  });

  it('builds a credit merged expense when net is positive', () => {
    const creditHeavy = [
      makeExpense({id: '1', mailId: '1', vendor: 'A', cost: 10, costType: 'debit'}),
      makeExpense({id: '2', mailId: '2', vendor: 'B', cost: 50, costType: 'credit'}),
    ];
    const merged = buildMergedExpense(creditHeavy, 'B', 'Refund');
    expect(merged.costType).toBe('credit');
    expect(merged.cost).toBe(40);
  });

  it('lists unique vendors', () => {
    expect(uniqueVendorsFromExpenses(expenses)).toEqual(['Swiggy', 'Zomato']);
  });
});

describe('home expense redux reducers', () => {
  const base = reducer(undefined, {type: '@@init'});

  it('opens and hides tag modal', () => {
    const expense = makeExpense();
    const opened = reducer(base, actions.setTagExpense(expense));
    expect(opened.isTagModal).toBe(true);
    expect(opened.expense).toEqual(expense);
    expect(reducer(opened, actions.hideTagExpense()).isTagModal).toBe(false);
  });

  it('updates existing expense tag by mailId and inserts otherwise', () => {
    const seeded = reducer(base, actions.setExpenseList([makeExpense({mailId: 'm1', tag: 'Food'})]));
    const updated = reducer(
      seeded,
      actions.updateExpense(makeExpense({mailId: 'm1', tag: 'Travel'})),
    );
    expect(updated.expenseList[0].tag).toBe('Travel');

    const inserted = reducer(
      updated,
      actions.updateExpense(makeExpense({mailId: 'm2', tag: 'Bills'})),
    );
    expect(inserted.expenseList).toHaveLength(2);
  });

  it('deletes expense by mailId', () => {
    const seeded = reducer(
      base,
      actions.setExpenseList([
        makeExpense({mailId: 'keep'}),
        makeExpense({mailId: 'drop', id: 'drop'}),
      ]),
    );
    const next = reducer(seeded, actions.deleteExpense(makeExpense({mailId: 'drop'})));
    expect(next.expenseList.map(e => e.mailId)).toEqual(['keep']);
  });

  it('merges expenses by removing originals and appending merged', () => {
    const originals = [
      makeExpense({id: '1', mailId: '1'}),
      makeExpense({id: '2', mailId: '2'}),
      makeExpense({id: '3', mailId: '3'}),
    ];
    const seeded = reducer(base, actions.setExpenseList(originals));
    const merged = makeExpense({id: '1', mailId: '1', operation: 'merged', cost: 300});
    const next = reducer(
      seeded,
      actions.mergeSaveExpense({originalExpenses: originals.slice(0, 2), mergedExpense: merged}),
    );
    expect(next.expenseList.map(e => e.id)).toEqual(['3', '1']);
    expect(next.expenseList[1].operation).toBe('merged');
  });

  it('upserts vendor tag map and persists locally', () => {
    const first = reducer(base, actions.setTagMap(makeVendorTag({vendor: 'swiggy', tag: 'Food'})));
    expect(first.vendorTagList).toHaveLength(1);
    const second = reducer(first, actions.setTagMap(makeVendorTag({vendor: 'swiggy', tag: 'Dining'})));
    expect(second.vendorTagList).toHaveLength(1);
    expect(second.vendorTagList[0].tag).toBe('Dining');
    expect(FinanceStorage.addVendorTag).toHaveBeenCalled();
  });

  it('sets full expense state and clears loading', () => {
    const next = reducer(
      base,
      actions.setExpenseState({
        expenseList: [makeExpense()],
        vendorTagList: [makeVendorTag()],
        darkMode: true,
      }),
    );
    expect(next.isAppLoading).toBe(false);
    expect(next.appConfig.darkMode).toBe(true);
    expect(next.expenseList).toHaveLength(1);
  });
});
