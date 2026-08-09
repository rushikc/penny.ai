import {resetFirebaseMock, seedCollection} from '../../helpers/mockFirebase';
import {DEFAULT_INVESTMENT_CONFIG} from '../../../utility/investmentCalculations';

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

describe('investment config API', () => {
  beforeEach(() => {
    resetFirebaseMock();
  });

  it('returns defaults when config is missing', async () => {
    expect(await ExpenseAPI.getInvestmentConfig()).toEqual(DEFAULT_INVESTMENT_CONFIG);
  });

  it('fills missing fields and empty assets with defaults', async () => {
    seedCollection('config', [
      {id: 'investments', data: {assets: [], includeSip: false}},
    ]);
    const cfg = await ExpenseAPI.getInvestmentConfig();
    expect(cfg.includeSip).toBe(false);
    expect(cfg.assets).toEqual(DEFAULT_INVESTMENT_CONFIG.assets);
    expect(cfg.years).toBe(DEFAULT_INVESTMENT_CONFIG.years);
    expect(cfg.assumedReturnRate).toBe(DEFAULT_INVESTMENT_CONFIG.assumedReturnRate);
  });

  it('persists and reloads investment config', async () => {
    const payload = {
      assets: [
        {
          id: 'custom',
          name: 'Custom',
          currentValue: 1,
          monthlyContribution: 2,
          currency: 'INR' as const,
        },
      ],
      includeSip: false,
      years: 3,
      assumedReturnRate: 10,
    };

    expect(await ExpenseAPI.updateInvestmentConfig(payload)).toBe(true);
    expect(await ExpenseAPI.getInvestmentConfig()).toEqual(payload);
  });
});
