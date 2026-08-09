jest.mock('../../api/ExpenseAPI', () => ({
  ExpenseAPI: {
    processData: jest.fn(() => Promise.resolve()),
    getVendorTagList: jest.fn(),
    getExpenseList: jest.fn(),
    getBudgetList: jest.fn(),
    getTagList: jest.fn(),
    getDarkModeConfig: jest.fn(),
  },
}));

jest.mock('../../store/expenseActions', () => ({
  setExpenseState: jest.fn(),
  setBudgetList: jest.fn(),
  setTagList: jest.fn(),
}));

import {ExpenseAPI} from '../../api/ExpenseAPI';
import {setBudgetList, setExpenseState, setTagList} from '../../store/expenseActions';
import {loadInitialAppData} from '../../pages/dataValidations';
import {makeBudget, makeExpense, makeVendorTag, ms} from '../fixtures/factories';

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

describe('loadInitialAppData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads all sources, sorts expenses, and hydrates redux state', async () => {
    const older = makeExpense({id: 'old', mailId: 'old', date: ms(2026, 1, 1)});
    const newer = makeExpense({id: 'new', mailId: 'new', date: ms(2026, 6, 1)});
    const vendors = [makeVendorTag()];
    const budgets = [makeBudget()];
    const tags = ['Food', 'Travel'];

    (ExpenseAPI.getVendorTagList as jest.Mock).mockResolvedValue(vendors);
    (ExpenseAPI.getExpenseList as jest.Mock).mockResolvedValue([older, newer]);
    (ExpenseAPI.getBudgetList as jest.Mock).mockResolvedValue(budgets);
    (ExpenseAPI.getTagList as jest.Mock).mockResolvedValue(tags);
    (ExpenseAPI.getDarkModeConfig as jest.Mock).mockResolvedValue(true);

    loadInitialAppData();
    expect(ExpenseAPI.processData).toHaveBeenCalled();

    await flushPromises();

    expect(setExpenseState).toHaveBeenCalledWith(
      [expect.objectContaining({id: 'new'}), expect.objectContaining({id: 'old'})],
      vendors,
      true,
    );
    expect(setBudgetList).toHaveBeenCalledWith(budgets);
    expect(setTagList).toHaveBeenCalledWith(tags);
  });

  it('logs when any load promise rejects', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (ExpenseAPI.getVendorTagList as jest.Mock).mockRejectedValue(new Error('boom'));
    (ExpenseAPI.getExpenseList as jest.Mock).mockResolvedValue([]);
    (ExpenseAPI.getBudgetList as jest.Mock).mockResolvedValue([]);
    (ExpenseAPI.getTagList as jest.Mock).mockResolvedValue([]);
    (ExpenseAPI.getDarkModeConfig as jest.Mock).mockResolvedValue(false);

    loadInitialAppData();
    await flushPromises();

    expect(errorSpy).toHaveBeenCalledWith(
      'Error loading app data:',
      expect.any(Error),
    );
    expect(setExpenseState).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
