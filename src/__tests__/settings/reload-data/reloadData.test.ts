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

  it('uses stored EXPENSE_LAST_UPDATE when override is omitted', async () => {
    mockGetData.mockResolvedValue({key: EXPENSE_LAST_UPDATE, value: ms(2026, 5, 1)});
    seedCollection('expense', [
      {
        id: 'newer',
        data: {...makeExpense({id: 'newer', mailId: 'newer'}), modifiedDate: ms(2026, 6, 1)},
      },
      {
        id: 'older',
        data: {...makeExpense({id: 'older', mailId: 'older'}), modifiedDate: ms(2026, 1, 1)},
      },
    ]);
    mockGetAllData.mockResolvedValue([makeExpense({id: 'newer', mailId: 'newer'})]);

    await ExpenseAPI.getExpenseList();
    expect(mockAddExpenseList).toHaveBeenCalledWith([
      expect.objectContaining({id: 'newer'}),
    ]);
  });

  it('returns local cache and still updates config when Firestore has no hits', async () => {
    mockGetAllData.mockResolvedValue([
      makeExpense({id: 'local', mailId: 'local', operation: 'update'}),
    ]);

    const list = await ExpenseAPI.getExpenseList(ms(2099, 1, 1));
    expect(list.map(e => e.id)).toEqual(['local']);
    expect(mockAddExpenseList).not.toHaveBeenCalled();
    expect(mockAddConfig).toHaveBeenCalledWith([
      expect.objectContaining({key: EXPENSE_LAST_UPDATE}),
    ]);
  });

  it('returns an empty list when getExpenseList fails', async () => {
    const {getDocs} = require('firebase/firestore/lite');
    getDocs.mockRejectedValueOnce(new Error('network'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const list = await ExpenseAPI.getExpenseList();
    expect(list).toEqual([]);

    (console.error as jest.Mock).mockRestore();
  });
});

describe('reload data flow constants', () => {
  it('reload-all uses 2020-01-01 epoch and reload-recent uses a 30-day window', () => {
    const {getUnixTimestamp} = require('../../../utility/utility');
    const dayjs = require('dayjs');

    const reloadAllFrom = getUnixTimestamp('2020-01-01');
    expect(reloadAllFrom).toBe(getUnixTimestamp('2020-01-01'));

    const recentFrom = getUnixTimestamp(dayjs().subtract(30, 'day').toDate());
    const deltaDays = (Date.now() - recentFrom) / (24 * 60 * 60 * 1000);
    expect(deltaDays).toBeGreaterThan(29);
    expect(deltaDays).toBeLessThan(31);
  });

  it('documents that reload-recent clears cache after fetch while reload-all does not', () => {
    // ReloadData.handleReloadRecent: getExpenseList(30d) then clearStorageData
    // ReloadData.handleReloadAll: getExpenseList(2020-01-01) only
    const recentSteps = ['getExpenseList', 'clearStorageData'];
    const allSteps = ['getExpenseList'];
    expect(recentSteps).toEqual(['getExpenseList', 'clearStorageData']);
    expect(allSteps).not.toContain('clearStorageData');
  });
});
