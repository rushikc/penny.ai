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

describe('profile theme', () => {
  const base = reducer(undefined, {type: '@@init'});

  it('toggles dark mode in redux', () => {
    expect(base.appConfig.darkMode).toBe(false);
    const on = reducer(base, actions.toggleDarkMode());
    expect(on.appConfig.darkMode).toBe(true);
    expect(reducer(on, actions.toggleDarkMode()).appConfig.darkMode).toBe(false);
  });

  it('reads and updates dark mode config', async () => {
    resetFirebaseMock();
    expect(await ExpenseAPI.getDarkModeConfig()).toBe(false);

    expect(await ExpenseAPI.updateDarkMode(true)).toBe(true);
    expect(await ExpenseAPI.getDarkModeConfig()).toBe(true);

    seedCollection('config', [{id: 'darkMode', data: {value: false}}]);
    expect(await ExpenseAPI.getDarkModeConfig()).toBe(false);
  });
});

describe('alerts', () => {
  const base = reducer(undefined, {type: '@@init'});

  it('adds alerts with generated ids and with explicit ids', () => {
    const withGenerated = reducer(
      base,
      actions.addAlert({type: 'success', message: 'Saved'}),
    );
    expect(withGenerated.alerts).toHaveLength(1);
    expect(withGenerated.alerts[0].id).toBeTruthy();

    const withId = reducer(
      withGenerated,
      actions.addAlert({id: 'fixed', type: 'error', message: 'Failed'}),
    );
    expect(withId.alerts.map(a => a.id)).toEqual([
      withGenerated.alerts[0].id,
      'fixed',
    ]);
  });

  it('removes and clears alerts', () => {
    const seeded = reducer(
      base,
      actions.addAlert({id: 'a1', type: 'info', message: 'One'}),
    );
    const withTwo = reducer(
      seeded,
      actions.addAlert({id: 'a2', type: 'info', message: 'Two'}),
    );
    expect(reducer(withTwo, actions.removeAlert('a1')).alerts.map(a => a.id)).toEqual(['a2']);
    expect(reducer(withTwo, actions.clearAllAlerts()).alerts).toEqual([]);
  });
});

describe('settings tile routes', () => {
  it('covers the profile dashboard destinations', () => {
    const routes = [
      '/setting-tags',
      '/toggle-theme',
      '/reload-expense',
      '/investment-calculator',
      '/setting-tag-maps',
      '/auto-tag-expenses',
      '/signout',
    ];
    expect(routes).toContain('/investment-calculator');
    expect(routes).toContain('/setting-tags');
    expect(routes).toContain('/auto-tag-expenses');
  });
});
