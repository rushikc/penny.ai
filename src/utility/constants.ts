export const EXPENSE_LAST_UPDATE = 'expenseLastUpdate';
export const TAG_LAST_UPDATE = 'tagLastUpdate';
export const BUDGET_LAST_UPDATE = 'budgetLastUpdate';
export const FX_USD_INR_RATE = 'fxUsdInrRate';
export const FX_RATE_LAST_UPDATE = 'fxRateLastUpdate';

export const FX_CACHE_TTL_MS = 10 * 60 * 1000;
export const DEFAULT_USD_TO_INR = 95.18;

/** When false, app auto-signs in via .env admin credentials; login screen stays optional. */
export const AUTH_REQUIRED = false;

import {dataPalette} from '../theme/tokens';

/** @deprecated Use dataPalette from theme/tokens directly. Kept for chart imports. */
export const CHART_COLORS = [...dataPalette];
