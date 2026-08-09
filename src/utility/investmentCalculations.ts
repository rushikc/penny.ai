import dayjs from 'dayjs';
import {InvestmentAsset, InvestmentConfig} from '../Types';

export const EPF_ANNUAL_RETURN_RATE = 8.25;
export const SIP_CREDIT_DAY = 3;

export const DEFAULT_YEARS = 0;
export const DEFAULT_RETURN_RATE = 12;

export const DEFAULT_INVESTMENT_ASSETS: InvestmentAsset[] = [
  {
    id: 'mutual-funds',
    name: 'Mutual Funds',
    currentValue: 500_000,
    monthlyContribution: 10_000,
    currency: 'INR',
  },
  {
    id: 'epf',
    name: 'EPF',
    currentValue: 800_000,
    monthlyContribution: 25_000,
    currency: 'INR',
    annualReturnRate: EPF_ANNUAL_RETURN_RATE,
  },
  {
    id: 'us-stocks',
    name: 'US Stocks',
    currentValue: 5_000,
    monthlyContribution: 0,
    currency: 'USD',
  },
];

export const DEFAULT_INVESTMENT_CONFIG: InvestmentConfig = {
  assets: DEFAULT_INVESTMENT_ASSETS,
  includeSip: true,
  years: DEFAULT_YEARS,
  assumedReturnRate: DEFAULT_RETURN_RATE,
};

export type InvestmentProjection = InvestmentAsset & {
  futureValue: number;
  futureValueInr: number;
  valueAsOfToday: number;
  appliedReturnRate: number;
  totalInvested: number;
  gain: number;
  accruedCreditMonths: number;
};

/** Credit date for a calendar month's SIP/PF installment (posts on the 3rd of the next month). */
export function creditDateForCalendarMonth(year: number, monthIndex: number): number {
  return dayjs(new Date(year, monthIndex, 1)).add(1, 'month').date(SIP_CREDIT_DAY).startOf('day').valueOf();
}

/**
 * Count SIP/PF credits between asOfDate and today.
 * A credit counts when asOfDate < creditDate <= today.
 * Missing asOfDate is treated as today (0 months).
 */
export function elapsedCreditMonths(
  asOfDateMs: number | undefined,
  todayMs: number = Date.now(),
): number {
  const effectiveAsOf = asOfDateMs ?? todayMs;
  if (effectiveAsOf >= todayMs) {
    return 0;
  }

  const asOf = dayjs(effectiveAsOf);
  let cursor = asOf.add(1, 'month').date(SIP_CREDIT_DAY).startOf('day');
  let count = 0;

  while (cursor.valueOf() <= todayMs) {
    if (effectiveAsOf < cursor.valueOf()) {
      count++;
    }
    cursor = cursor.add(1, 'month');
  }

  return count;
}

/**
 * Future value of a lump sum compounded monthly for a given month count.
 * FV = P * (1 + r)^n
 */
export function calculateLumpSumForMonths(
  principal: number,
  annualReturnRate: number,
  months: number,
): number {
  if (months <= 0) {
    return principal;
  }

  const monthlyRate = annualReturnRate / 100 / 12;
  return principal * Math.pow(1 + monthlyRate, months);
}

/**
 * Future value of monthly SIP contributions compounded monthly for a given month count.
 * FV = PMT * (((1 + r)^n - 1) / r) * (1 + r)
 */
export function calculateSipFutureValueForMonths(
  monthlyContribution: number,
  annualReturnRate: number,
  months: number,
): number {
  if (months <= 0 || monthlyContribution === 0) {
    return 0;
  }

  const monthlyRate = annualReturnRate / 100 / 12;

  if (monthlyRate === 0) {
    return monthlyContribution * months;
  }

  const compoundFactor = Math.pow(1 + monthlyRate, months);
  return monthlyContribution * ((compoundFactor - 1) / monthlyRate) * (1 + monthlyRate);
}

/**
 * Future value of a lump sum compounded monthly.
 * FV = P * (1 + r)^n
 */
export function calculateLumpSumFutureValue(
  principal: number,
  annualReturnRate: number,
  years: number,
): number {
  return calculateLumpSumForMonths(principal, annualReturnRate, years * 12);
}

/**
 * Future value of monthly SIP contributions compounded monthly.
 * FV = PMT * (((1 + r)^n - 1) / r) * (1 + r)
 */
export function calculateSipFutureValue(
  monthlyContribution: number,
  annualReturnRate: number,
  years: number,
): number {
  return calculateSipFutureValueForMonths(monthlyContribution, annualReturnRate, years * 12);
}

/**
 * Phase A: accrue saved balance + retrospective SIPs from asOfDate to today.
 */
export function calculateValueAsOfToday(
  asset: InvestmentAsset,
  annualReturnRate: number,
  todayMs: number = Date.now(),
): {valueAsOfToday: number; accruedCreditMonths: number} {
  const accruedCreditMonths = elapsedCreditMonths(asset.asOfDate, todayMs);

  if (accruedCreditMonths === 0) {
    return {valueAsOfToday: asset.currentValue, accruedCreditMonths: 0};
  }

  const valueAsOfToday =
    calculateLumpSumForMonths(asset.currentValue, annualReturnRate, accruedCreditMonths) +
    calculateSipFutureValueForMonths(
      asset.monthlyContribution,
      annualReturnRate,
      accruedCreditMonths,
    );

  return {valueAsOfToday, accruedCreditMonths};
}

/**
 * Combined future value for an asset with a current balance and optional monthly contributions.
 */
export function calculateAssetFutureValue(
  currentValue: number,
  monthlyContribution: number,
  annualReturnRate: number,
  years: number,
  includeSip: boolean,
): number {
  const lumpSum = calculateLumpSumFutureValue(currentValue, annualReturnRate, years);
  const sip = includeSip
    ? calculateSipFutureValue(monthlyContribution, annualReturnRate, years)
    : 0;
  return lumpSum + sip;
}

export function calculateInvestmentProjections(
  assets: InvestmentAsset[],
  years: number,
  assumedReturnRate: number,
  usdToInrRate: number,
  includeSip: boolean,
  todayMs: number = Date.now(),
): {
  projections: InvestmentProjection[];
  totalInr: number;
  totalInvestedInr: number;
  totalGainInr: number;
} {
  const forwardMonths = years * 12;

  const projections = assets.map(asset => {
    const appliedReturnRate = asset.annualReturnRate ?? assumedReturnRate;
    const {valueAsOfToday, accruedCreditMonths} = calculateValueAsOfToday(
      asset,
      appliedReturnRate,
      todayMs,
    );

    const futureValue =
      years === 0
        ? valueAsOfToday
        : calculateAssetFutureValue(
            valueAsOfToday,
            asset.monthlyContribution,
            appliedReturnRate,
            years,
            includeSip,
          );

    const futureValueInr = asset.currency === 'USD' ? futureValue * usdToInrRate : futureValue;
    const retrospectiveInvested =
      asset.currentValue + asset.monthlyContribution * accruedCreditMonths;
    const forwardInvested = years > 0 && includeSip ? asset.monthlyContribution * forwardMonths : 0;
    const totalInvested = retrospectiveInvested + forwardInvested;
    const gain = futureValue - totalInvested;

    return {
      ...asset,
      futureValue,
      futureValueInr,
      valueAsOfToday,
      appliedReturnRate,
      totalInvested,
      gain,
      accruedCreditMonths,
    };
  });

  const totalInr = projections.reduce((sum, projection) => sum + projection.futureValueInr, 0);
  const totalInvestedInr = projections.reduce((sum, projection) => {
    const investedInr =
      projection.currency === 'USD'
        ? projection.totalInvested * usdToInrRate
        : projection.totalInvested;
    return sum + investedInr;
  }, 0);
  const totalGainInr = totalInr - totalInvestedInr;

  return {projections, totalInr, totalInvestedInr, totalGainInr};
}

export function formatHorizonLabel(years: number): string {
  if (years === 0) {
    return 'Today';
  }
  return `${years} ${years === 1 ? 'year' : 'years'}`;
}

export function formatAsOfMonth(asOfDateMs?: number): string {
  if (!asOfDateMs) {
    return 'today';
  }
  return new Intl.DateTimeFormat('en-IN', {month: 'short', year: 'numeric'}).format(
    new Date(asOfDateMs),
  );
}
