export const EXPENSE_LAST_UPDATE = 'expenseLastUpdate';
export const TAG_LAST_UPDATE = 'tagLastUpdate';
export const BUDGET_LAST_UPDATE = 'budgetLastUpdate';

/** When false, app auto-signs in via .env admin credentials; login screen stays optional. */
export const AUTH_REQUIRED = false;

import {dataPalette} from '../theme/tokens';

/** @deprecated Use dataPalette from theme/tokens directly. Kept for chart imports. */
export const CHART_COLORS = [...dataPalette];
