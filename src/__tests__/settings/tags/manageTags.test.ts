import {resetFirebaseMock, seedCollection} from '../../helpers/mockFirebase';
import {expenseSlice} from '../../../store/expenseSlice';

jest.mock('../../../api/FinanceStorage', () => ({
  FinanceStorage: {
    getData: jest.fn(),
    addConfig: jest.fn(),
    getAllData: jest.fn(),
    addExpenseList: jest.fn(),
    addVendorTag: jest.fn(),
    addBudgetList: jest.fn(),
    deleteBudget: jest.fn(),
    deleteExpense: jest.fn(),
    clearStorageData: jest.fn(),
  },
}));

import {ExpenseAPI} from '../../../api/ExpenseAPI';

const {actions, reducer} = expenseSlice;

describe('tag list redux', () => {
  const base = reducer(undefined, {type: '@@init'});

  it('sets tag list', () => {
    expect(reducer(base, actions.setTagList(['Food', 'Travel'])).tagList).toEqual([
      'Food',
      'Travel',
    ]);
  });

  it('adds unique tags only', () => {
    const withOne = reducer(base, actions.addTag('Food'));
    const withDup = reducer(withOne, actions.addTag('Food'));
    const withTwo = reducer(withDup, actions.addTag('Travel'));
    expect(withTwo.tagList).toEqual(['Food', 'Travel']);
  });

  it('deletes a tag', () => {
    const seeded = reducer(base, actions.setTagList(['Food', 'Travel']));
    expect(reducer(seeded, actions.deleteTag('Food')).tagList).toEqual(['Travel']);
  });
});

describe('ExpenseAPI tag list', () => {
  beforeEach(() => {
    resetFirebaseMock();
  });

  it('returns empty list when config is missing', async () => {
    expect(await ExpenseAPI.getTagList()).toEqual([]);
  });

  it('reads and updates tag list config', async () => {
    seedCollection('config', [{id: 'tags', data: {tagList: ['Food']}}]);
    expect(await ExpenseAPI.getTagList()).toEqual(['Food']);

    await ExpenseAPI.updateTagList(['Food', 'Travel']);
    expect(await ExpenseAPI.getTagList()).toEqual(['Food', 'Travel']);
  });
});
