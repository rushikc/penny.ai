import {resetFirebaseMock, seedCollection} from '../../helpers/mockFirebase';
import {expenseSlice} from '../../../store/expenseSlice';
import {store} from '../../../store/store';
import {createTimedAlert, removeAlert} from '../../../store/alertActions';
import {SETTINGS_TILE_ROUTES} from '../../../pages/setting/settingsRoutes';

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

describe('alertActions wrappers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    store.dispatch(actions.clearAllAlerts());
  });

  afterEach(() => {
    jest.useRealTimers();
    store.dispatch(actions.clearAllAlerts());
  });

  it('createTimedAlert adds an alert and removes it after the default timeout', () => {
    const id = createTimedAlert({type: 'success', message: 'Saved'});
    expect(id).toBeTruthy();
    expect(store.getState().expense.alerts).toEqual([
      expect.objectContaining({id, type: 'success', message: 'Saved'}),
    ]);

    jest.advanceTimersByTime(3000);
    expect(store.getState().expense.alerts).toEqual([]);
  });

  it('createTimedAlert honors a custom timeout', () => {
    const id = createTimedAlert({type: 'info', message: 'Wait'}, 1000);
    jest.advanceTimersByTime(999);
    expect(store.getState().expense.alerts.map(a => a.id)).toEqual([id]);
    jest.advanceTimersByTime(1);
    expect(store.getState().expense.alerts).toEqual([]);
  });

  it('removeAlert wrapper clears a specific alert immediately', () => {
    const id = createTimedAlert({type: 'error', message: 'Nope'}, 10_000);
    removeAlert(id);
    expect(store.getState().expense.alerts).toEqual([]);
  });
});

describe('settings tile routes', () => {
  it('matches the exported profile dashboard destinations', () => {
    expect(SETTINGS_TILE_ROUTES).toEqual([
      '/setting-tags',
      '/toggle-theme',
      '/reload-expense',
      '/investment-calculator',
      '/setting-tag-maps',
      '/auto-tag-expenses',
      '/signout',
    ]);
  });
});
