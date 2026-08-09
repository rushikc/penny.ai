import {resetFirebaseMock, seedCollection} from '../../helpers/mockFirebase';

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
import {validateCreditCardDigits} from '../../../pages/setting/bankCardValidation';

describe('validateCreditCardDigits', () => {
  it('requires exactly 4 digits', () => {
    expect(validateCreditCardDigits('', [])).toEqual({
      ok: false,
      error: 'Enter exactly 4 digits',
    });
    expect(validateCreditCardDigits('12', [])).toEqual({
      ok: false,
      error: 'Enter exactly 4 digits',
    });
    expect(validateCreditCardDigits('abcd', [])).toEqual({
      ok: false,
      error: 'Enter exactly 4 digits',
    });
  });

  it('rejects duplicates and accepts new cards', () => {
    expect(validateCreditCardDigits('1234', ['1234'])).toEqual({
      ok: false,
      error: 'Card already added',
    });
    expect(validateCreditCardDigits('5678', ['1234'])).toEqual({ok: true});
  });
});

describe('bank configuration', () => {
  beforeEach(() => {
    resetFirebaseMock();
  });

  it('returns defaults when bank config is missing', async () => {
    expect(await ExpenseAPI.getBankConfig()).toEqual({
      enableUpi: false,
      creditCards: [],
    });
  });

  it('reads existing bank config with fallbacks', async () => {
    seedCollection('config', [
      {id: 'bankConfig', data: {enableUpi: true, creditCards: ['1234', '9876']}},
    ]);
    expect(await ExpenseAPI.getBankConfig()).toEqual({
      enableUpi: true,
      creditCards: ['1234', '9876'],
    });
  });

  it('updates bank config and reads it back', async () => {
    const ok = await ExpenseAPI.updateBankConfig({
      enableUpi: true,
      creditCards: ['1111'],
    });
    expect(ok).toBe(true);
    expect(await ExpenseAPI.getBankConfig()).toEqual({
      enableUpi: true,
      creditCards: ['1111'],
    });
  });

  it('fills missing fields with defaults', async () => {
    seedCollection('config', [{id: 'bankConfig', data: {}}]);
    expect(await ExpenseAPI.getBankConfig()).toEqual({
      enableUpi: false,
      creditCards: [],
    });
  });
});
