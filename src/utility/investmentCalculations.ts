export type InvestmentAsset = {
  id: string;
  name: string;
  currentValue: number;
  monthlyContribution: number;
  currency: 'INR' | 'USD';
  /** When omitted, projections use the slider's assumed return rate. */
  annualReturnRate?: number;
};

export const EPF_ANNUAL_RETURN_RATE = 8.25;

export type InvestmentProjection = InvestmentAsset & {
  futureValue: number;
  futureValueInr: number;
  appliedReturnRate: number;
};

/**
 * Future value of a lump sum compounded monthly.
 * FV = P * (1 + r)^n
 */
export function calculateLumpSumFutureValue(
  principal: number,
  annualReturnRate: number,
  years: number,
): number {
  const monthlyRate = annualReturnRate / 100 / 12;
  const months = years * 12;
  return principal * Math.pow(1 + monthlyRate, months);
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
  const monthlyRate = annualReturnRate / 100 / 12;
  const months = years * 12;

  if (monthlyContribution === 0) {
    return 0;
  }

  if (monthlyRate === 0) {
    return monthlyContribution * months;
  }

  const compoundFactor = Math.pow(1 + monthlyRate, months);
  return monthlyContribution * ((compoundFactor - 1) / monthlyRate) * (1 + monthlyRate);
}

/**
 * Combined future value for an asset with a current balance and monthly contributions.
 */
export function calculateAssetFutureValue(
  currentValue: number,
  monthlyContribution: number,
  annualReturnRate: number,
  years: number,
): number {
  const lumpSum = calculateLumpSumFutureValue(currentValue, annualReturnRate, years);
  const sip = calculateSipFutureValue(monthlyContribution, annualReturnRate, years);
  return lumpSum + sip;
}

export function calculateInvestmentProjections(
  assets: InvestmentAsset[],
  years: number,
  assumedReturnRate: number,
  usdToInrRate: number,
): {projections: InvestmentProjection[]; totalInr: number} {
  const projections = assets.map(asset => {
    const appliedReturnRate = asset.annualReturnRate ?? assumedReturnRate;
    const futureValue = calculateAssetFutureValue(
      asset.currentValue,
      asset.monthlyContribution,
      appliedReturnRate,
      years,
    );
    const futureValueInr = asset.currency === 'USD' ? futureValue * usdToInrRate : futureValue;

    return {
      ...asset,
      futureValue,
      futureValueInr,
      appliedReturnRate,
    };
  });

  const totalInr = projections.reduce((sum, projection) => sum + projection.futureValueInr, 0);

  return {projections, totalInr};
}

/** Mock saved investment data until a real data source is wired up. */
export async function fetchInvestmentData(): Promise<InvestmentAsset[]> {
  return [
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
}
