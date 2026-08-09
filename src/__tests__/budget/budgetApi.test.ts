import {resetFirebaseMock, seedCollection} from '../helpers/mockFirebase';
import {makeBudget} from '../fixtures/factories';
import {BUDGET_LAST_UPDATE} from '../../utility/constants';

jest.mock('../../api/FinanceStorage', () => ({
  FinanceStorage: {
    getData: jest.fn(),
    addBudgetList: jest.fn(() => Promise.resolve()),
    deleteBudget: jest.fn(() => Promise.resolve()),
    addConfig: jest.fn(() => Promise.resolve()),
    getAllData: jest.fn(),
  },
}));

import {FinanceStorage} from '../../api/FinanceStorage';
import {ExpenseAPI} from '../../api/ExpenseAPI';

const mockStorage = FinanceStorage as unknown as {
  getData: jest.Mock;
  addBudgetList: jest.Mock;
  deleteBudget: jest.Mock;
  addConfig: jest.Mock;
  getAllData: jest.Mock;
};

describe('ExpenseAPI budget methods', () => {
  beforeEach(() => {
    resetFirebaseMock();
    jest.clearAllMocks();
    mockStorage.getData.mockResolvedValue(undefined);
    mockStorage.getAllData.mockResolvedValue([]);
  });

  it('adds a budget with generated key and caches locally', async () => {
    const result = await ExpenseAPI.addBudget(
      makeBudget({id: '', name: 'Food Budget', amount: 2000}),
      'create',
    );

    expect(result.id).toMatch(/^food_budget_\d+$/);
    expect(result.operation).toBe('create');
    expect(mockStorage.addBudgetList).toHaveBeenCalledWith([
      expect.objectContaining({name: 'Food Budget', amount: 2000}),
    ]);
  });

  it('updates a budget and refreshes local cache', async () => {
    seedCollection('budget', [{id: 'b1', data: {name: 'Old'}}]);
    const result = await ExpenseAPI.updateBudget(
      makeBudget({id: 'b1', name: 'New', amount: 3000}),
    );
    expect(result).toMatchObject({id: 'b1', name: 'New', operation: 'update'});
    expect(mockStorage.addBudgetList).toHaveBeenCalled();
  });

  it('deletes a budget remotely and locally', async () => {
    seedCollection('budget', [{id: 'b1', data: {name: 'Old'}}]);
    const ok = await ExpenseAPI.deleteBudget(makeBudget({id: 'b1'}));
    expect(ok).toBe(true);
    expect(mockStorage.deleteBudget).toHaveBeenCalledWith('b1');
  });

  it('getBudgetList merges firestore docs, updates last sync, and filters deletes', async () => {
    mockStorage.getData.mockResolvedValue({key: BUDGET_LAST_UPDATE, value: 1000});
    seedCollection('budget', [
      {id: 'keep', data: {name: 'Keep', modifiedDate: 2000, operation: 'update'}},
      {id: 'drop', data: {name: 'Drop', modifiedDate: 2000, operation: 'delete'}},
    ]);
    mockStorage.getAllData.mockResolvedValue([
      makeBudget({id: 'keep', operation: 'update'}),
      makeBudget({id: 'drop', operation: 'delete'}),
    ]);

    const list = await ExpenseAPI.getBudgetList();
    expect(list.map(b => b.id)).toEqual(['keep']);
    expect(mockStorage.addConfig).toHaveBeenCalledWith([
      expect.objectContaining({key: BUDGET_LAST_UPDATE}),
    ]);
  });

  it('honors overrideLastDate when fetching budgets', async () => {
    seedCollection('budget', [
      {id: 'recent', data: {name: 'Recent', modifiedDate: 5000, operation: 'update'}},
      {id: 'old', data: {name: 'Old', modifiedDate: 1000, operation: 'update'}},
    ]);
    mockStorage.getAllData.mockResolvedValue([
      makeBudget({id: 'recent'}),
      makeBudget({id: 'old'}),
    ]);

    await ExpenseAPI.getBudgetList(4000);
    expect(mockStorage.addBudgetList).toHaveBeenCalledWith([
      expect.objectContaining({id: 'recent'}),
    ]);
  });
});
