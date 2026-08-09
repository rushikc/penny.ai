import {resetFirebaseMock, seedCollection,firebaseFirestoreLiteMock} from '../../helpers/mockFirebase';
import {ms} from '../../fixtures/factories';

jest.mock('../../../api/FinanceStorage', () => ({
  FinanceStorage: {
    getAllData: jest.fn(),
    addExpenseList: jest.fn(() => Promise.resolve()),
    getData: jest.fn(),
    addConfig: jest.fn(),
    addVendorTag: jest.fn(),
    addBudgetList: jest.fn(),
    deleteBudget: jest.fn(),
    deleteExpense: jest.fn(),
    clearStorageData: jest.fn(),
  },
}));

jest.mock('../../../utility/utility', () => {
  const actual = jest.requireActual('../../../utility/utility');
  return {
    ...actual,
    sleep: jest.fn(() => Promise.resolve()),
  };
});

import {FinanceStorage} from '../../../api/FinanceStorage';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import {sleep} from '../../../utility/utility';

const mockStorage = FinanceStorage as unknown as {
  getAllData: jest.Mock;
  addExpenseList: jest.Mock;
};

describe('ExpenseAPI.autoTagPastExpenses', () => {
  beforeEach(() => {
    resetFirebaseMock();
    jest.clearAllMocks();
  });

  it('returns 0 when no vendor tags exist', async () => {
    mockStorage.getAllData.mockResolvedValue([]);
    expect(await ExpenseAPI.autoTagPastExpenses(ms(2020, 1, 1))).toBe(0);
  });

  it('skips already tagged expenses and matches vendor case-insensitively', async () => {
    mockStorage.getAllData.mockResolvedValue([
      {id: 'vt1', vendor: 'Swiggy', tag: 'Food', date: ms(2026, 1, 1)},
    ]);
    seedCollection('expense', [
      {
        id: 'e1',
        data: {
          vendor: 'swiggy',
          tag: undefined,
          modifiedDate: ms(2026, 6, 1),
          mailId: 'm1',
          cost: 10,
          costType: 'debit',
          date: ms(2026, 6, 1),
          user: 'u',
          type: 'upi',
          operation: 'update',
        },
      },
      {
        id: 'e2',
        data: {
          vendor: 'swiggy',
          tag: 'Already',
          modifiedDate: ms(2026, 6, 1),
          mailId: 'm2',
          cost: 10,
          costType: 'debit',
          date: ms(2026, 6, 1),
          user: 'u',
          type: 'upi',
          operation: 'update',
        },
      },
      {
        id: 'e3',
        data: {
          vendor: 'uber',
          tag: undefined,
          modifiedDate: ms(2026, 6, 1),
          mailId: 'm3',
          cost: 10,
          costType: 'debit',
          date: ms(2026, 6, 1),
          user: 'u',
          type: 'upi',
          operation: 'update',
        },
      },
    ]);

    const count = await ExpenseAPI.autoTagPastExpenses(ms(2026, 1, 1));
    expect(count).toBe(1);
    expect(mockStorage.addExpenseList).toHaveBeenCalledWith([
      expect.objectContaining({id: 'e1', tag: 'Food'}),
    ]);
  });

  it('returns 0 when no untagged expenses match', async () => {
    mockStorage.getAllData.mockResolvedValue([
      {id: 'vt1', vendor: 'swiggy', tag: 'Food', date: ms(2026, 1, 1)},
    ]);
    seedCollection('expense', [
      {
        id: 'e1',
        data: {
          vendor: 'amazon',
          tag: undefined,
          modifiedDate: ms(2026, 6, 1),
          mailId: 'm1',
          cost: 10,
          costType: 'debit',
          date: ms(2026, 6, 1),
          user: 'u',
          type: 'upi',
          operation: 'update',
        },
      },
    ]);

    expect(await ExpenseAPI.autoTagPastExpenses(ms(2026, 1, 1))).toBe(0);
  });

  it('batches updates over 700 expenses and sleeps between batches', async () => {
    mockStorage.getAllData.mockResolvedValue([
      {id: 'vt1', vendor: 'swiggy', tag: 'Food', date: ms(2026, 1, 1)},
    ]);
    const docs = Array.from({length: 701}, (_, i) => ({
      id: `e${i}`,
      data: {
        vendor: 'swiggy',
        tag: undefined,
        modifiedDate: ms(2026, 6, 1),
        mailId: `m${i}`,
        cost: 10,
        costType: 'debit',
        date: ms(2026, 6, 1),
        user: 'u',
        type: 'upi',
        operation: 'update',
      },
    }));
    seedCollection('expense', docs);

    const count = await ExpenseAPI.autoTagPastExpenses(ms(2026, 1, 1));
    expect(count).toBe(701);
    expect(mockStorage.addExpenseList).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(1500);
  });

  it('returns 0 when Firestore query fails', async () => {
    mockStorage.getAllData.mockResolvedValue([
      {id: 'vt1', vendor: 'swiggy', tag: 'Food', date: ms(2026, 1, 1)},
    ]);
    firebaseFirestoreLiteMock.getDocs.mockRejectedValueOnce(new Error('firestore down'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(await ExpenseAPI.autoTagPastExpenses(ms(2026, 1, 1))).toBe(0);

    (console.error as jest.Mock).mockRestore();
  });
});
