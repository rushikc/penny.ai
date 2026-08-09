import AsyncStorage from '@react-native-async-storage/async-storage';
import {FinanceStorage} from '../../../api/FinanceStorage';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import {resetFirebaseMock, seedCollection} from '../../helpers/mockFirebase';
import {makeExpense, ms} from '../../fixtures/factories';
import {EXPENSE_LAST_UPDATE} from '../../../utility/constants';

describe('reload data storage clearing', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('clears all finance storage keys', async () => {
    await FinanceStorage.addExpenseList([makeExpense()]);
    await FinanceStorage.addConfig([{key: 'k', value: 1}]);
    await FinanceStorage.clearStorageData();

    expect(await FinanceStorage.getAllData('expense')).toEqual([]);
    expect(await FinanceStorage.getAllData('config')).toEqual([]);
  });
});

describe('reload expense list with override dates', () => {
  const mockGetData = jest.spyOn(FinanceStorage, 'getData');
  const mockAddExpenseList = jest.spyOn(FinanceStorage, 'addExpenseList');
  const mockAddConfig = jest.spyOn(FinanceStorage, 'addConfig');
  const mockGetAllData = jest.spyOn(FinanceStorage, 'getAllData');

  beforeEach(() => {
    resetFirebaseMock();
    jest.clearAllMocks();
    mockGetData.mockResolvedValue(undefined);
    mockAddExpenseList.mockResolvedValue(undefined);
    mockAddConfig.mockResolvedValue(undefined);
    mockGetAllData.mockResolvedValue([]);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('uses overrideLastDate similar to last-30-days reload', async () => {
    seedCollection('expense', [
      {
        id: 'recent',
        data: {
          ...makeExpense({id: 'recent', mailId: 'recent'}),
          modifiedDate: ms(2026, 6, 10),
        },
      },
      {
        id: 'old',
        data: {
          ...makeExpense({id: 'old', mailId: 'old'}),
          modifiedDate: ms(2026, 1, 1),
        },
      },
    ]);
    mockGetAllData.mockResolvedValue([
      makeExpense({id: 'recent', mailId: 'recent', operation: 'update'}),
    ]);

    const thirtyDaysAgo = ms(2026, 5, 15);
    const list = await ExpenseAPI.getExpenseList(thirtyDaysAgo);
    expect(mockAddExpenseList).toHaveBeenCalledWith([
      expect.objectContaining({id: 'recent'}),
    ]);
    expect(list).toHaveLength(1);
    expect(mockAddConfig).toHaveBeenCalledWith([
      expect.objectContaining({key: EXPENSE_LAST_UPDATE}),
    ]);
  });

  it('filters soft-deleted expenses from local cache on reload', async () => {
    mockGetAllData.mockResolvedValue([
      makeExpense({id: 'keep', mailId: 'keep', operation: 'update'}),
      makeExpense({id: 'gone', mailId: 'gone', operation: 'delete'}),
    ]);

    const list = await ExpenseAPI.getExpenseList(ms(2020, 1, 1));
    expect(list.map(e => e.id)).toEqual(['keep']);
  });
});
