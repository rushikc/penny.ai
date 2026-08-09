import {
  firebaseFirestoreLiteMock,
  resetFirebaseMock,
  seedCollection,
} from '../helpers/mockFirebase';
import {makeExpense, ms} from '../fixtures/factories';
import {getDateJsIdFormat} from '../../utility/utility';

jest.mock('../../api/FinanceStorage', () => ({
  FinanceStorage: {
    addExpenseList: jest.fn(() => Promise.resolve()),
    deleteExpense: jest.fn(() => Promise.resolve()),
    getData: jest.fn(),
    addConfig: jest.fn(),
    getAllData: jest.fn(),
  },
}));

import {FinanceStorage} from '../../api/FinanceStorage';
import {ExpenseAPI} from '../../api/ExpenseAPI';

const mockStorage = FinanceStorage as unknown as {
  addExpenseList: jest.Mock;
  deleteExpense: jest.Mock;
};

describe('ExpenseAPI.addExpense', () => {
  beforeEach(() => {
    resetFirebaseMock();
    jest.clearAllMocks();
  });

  it('builds a date+vendor key, rounds cost, strips id for write, and caches locally', async () => {
    const date = ms(2026, 6, 8, 15);
    const expense = makeExpense({
      id: 'old-id',
      vendor: 'SwiggyStores',
      cost: 12.345,
      date,
      mailId: 'm-add',
    });

    const result = await ExpenseAPI.addExpense(expense);

    const expectedKey = `${getDateJsIdFormat(new Date(date))} ${'SwiggyStores'.slice(0, 10)}`;
    expect(result.id).toBe(expectedKey);
    expect(result.cost).toBe(12.35);
    expect(result.operation).toBe('update');
    expect(mockStorage.addExpenseList).toHaveBeenCalledWith([
      expect.objectContaining({id: expectedKey, cost: 12.35, mailId: 'm-add'}),
    ]);

    const [, payload] = firebaseFirestoreLiteMock.setDoc.mock.calls[0];
    expect(payload).not.toHaveProperty('id');
    expect(payload).toMatchObject({
      vendor: 'SwiggyStores',
      cost: 12.35,
      mailId: 'm-add',
    });
  });

  it('preserves soft-delete operation', async () => {
    const result = await ExpenseAPI.addExpense(
      makeExpense({vendor: 'Uber', cost: 10, date: ms(2026, 6, 1)}),
      'delete',
    );
    expect(result.operation).toBe('delete');
  });

  it('returns the original expense when writing fails', async () => {
    firebaseFirestoreLiteMock.setDoc.mockRejectedValueOnce(new Error('write failed'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const original = makeExpense({id: 'keep', vendor: 'Fail', cost: 9});
    const result = await ExpenseAPI.addExpense(original);
    expect(result).toBe(original);

    (console.error as jest.Mock).mockRestore();
  });
});

describe('ExpenseAPI.deleteExpense', () => {
  beforeEach(() => {
    resetFirebaseMock();
    jest.clearAllMocks();
  });

  it('deletes remote and local when mailId is present', async () => {
    seedCollection('expense', [{id: 'e1', data: {vendor: 'A'}}]);
    const ok = await ExpenseAPI.deleteExpense(makeExpense({id: 'e1', mailId: 'mail-1'}));
    expect(ok).toBe(true);
    expect(mockStorage.deleteExpense).toHaveBeenCalledWith('mail-1');
    expect(firebaseFirestoreLiteMock.deleteDoc).toHaveBeenCalled();
  });

  it('skips local delete when mailId is missing', async () => {
    seedCollection('expense', [{id: 'e2', data: {vendor: 'B'}}]);
    const ok = await ExpenseAPI.deleteExpense(makeExpense({id: 'e2', mailId: ''}));
    expect(ok).toBe(true);
    expect(mockStorage.deleteExpense).not.toHaveBeenCalled();
  });

  it('returns false when delete fails', async () => {
    firebaseFirestoreLiteMock.deleteDoc.mockRejectedValueOnce(new Error('delete failed'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const ok = await ExpenseAPI.deleteExpense(makeExpense({id: 'e3', mailId: 'm'}));
    expect(ok).toBe(false);

    (console.error as jest.Mock).mockRestore();
  });
});
