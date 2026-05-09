import {Alert} from '../Types';
import {expenseSlice} from './expenseSlice';
import {store} from './store';
import {generateUUID} from '../utility/utility';

export const createTimedAlert = (
  alert: Omit<Alert, 'id'>,
  timeout = 3000
) => {
  const alertId = generateUUID();
  const alertWithId: Alert = {id: alertId, ...alert};

  store.dispatch(expenseSlice.actions.addAlert(alertWithId));

  setTimeout(() => {
    store.dispatch(expenseSlice.actions.removeAlert(alertId));
  }, timeout);

  return alertId;
};

export const removeAlert = (alertId: string) => {
  store.dispatch(expenseSlice.actions.removeAlert(alertId));
};
