import {InvestmentAsset} from '../../../Types';
import {
  calculateInvestmentProjections,
  calculateLumpSumForMonths,
  calculateSipFutureValueForMonths,
  calculateValueAsOfToday,
  creditDateForCalendarMonth,
  DEFAULT_INVESTMENT_CONFIG,
  elapsedCreditMonths,
  formatAsOfMonth,
  formatHorizonLabel,
  calculateLumpSumFutureValue,
  calculateSipFutureValue,
  calculateAssetFutureValue,
  SIP_CREDIT_DAY,
} from '../../../utility/investmentCalculations';

const ms = (year: number, month: number, day: number) => new Date(year, month - 1, day).getTime();

describe('elapsedCreditMonths', () => {
  it('counts 5 credits from Jan 15 2026 to Jun 8 2026', () => {
    expect(elapsedCreditMonths(ms(2026, 1, 15), ms(2026, 6, 8))).toBe(5);
  });

  it('counts 4 credits when asOf is after the Feb 3 credit', () => {
    expect(elapsedCreditMonths(ms(2026, 2, 5), ms(2026, 6, 8))).toBe(4);
  });

  it('returns 0 before the first credit lands', () => {
    expect(elapsedCreditMonths(ms(2026, 1, 15), ms(2026, 2, 2))).toBe(0);
  });

  it('returns 0 when the next credit is still in the future on Jun 3', () => {
    expect(elapsedCreditMonths(ms(2026, 6, 3), ms(2026, 6, 8))).toBe(0);
  });

  it('returns 0 when asOfDate is missing', () => {
    expect(elapsedCreditMonths(undefined, ms(2026, 6, 8))).toBe(0);
  });

  it('returns 0 when asOfDate is in the future', () => {
    expect(elapsedCreditMonths(ms(2026, 7, 1), ms(2026, 6, 8))).toBe(0);
  });
});

describe('calculateValueAsOfToday', () => {
  const baseAsset: InvestmentAsset = {
    id: 'mf',
    name: 'Mutual Funds',
    currentValue: 600_000,
    monthlyContribution: 80_000,
    currency: 'INR',
    asOfDate: ms(2026, 1, 15),
  };
  const today = ms(2026, 6, 8);
  const rate = 12;

  it('returns currentValue unchanged when no credits have elapsed', () => {
    const result = calculateValueAsOfToday(baseAsset, rate, ms(2026, 2, 2));
    expect(result.accruedCreditMonths).toBe(0);
    expect(result.valueAsOfToday).toBe(600_000);
  });

  it('accrues lump sum and SIP over 5 credit months', () => {
    const {accruedCreditMonths: months, valueAsOfToday} = calculateValueAsOfToday(
      baseAsset,
      rate,
      today,
    );
    expect(months).toBe(5);
    const expected =
      calculateLumpSumForMonths(600_000, rate, 5) +
      calculateSipFutureValueForMonths(80_000, rate, 5);
    expect(valueAsOfToday).toBeCloseTo(expected, 2);
  });

  it('accrues interest only when monthly contribution is zero', () => {
    const asset: InvestmentAsset = {...baseAsset, monthlyContribution: 0};
    const {valueAsOfToday} = calculateValueAsOfToday(asset, rate, today);
    expect(valueAsOfToday).toBeCloseTo(calculateLumpSumForMonths(600_000, rate, 5), 2);
  });
});

describe('calculateInvestmentProjections', () => {
  const today = ms(2026, 6, 8);
  const inrAsset: InvestmentAsset = {
    id: 'mf',
    name: 'Mutual Funds',
    currentValue: 600_000,
    monthlyContribution: 80_000,
    currency: 'INR',
    asOfDate: ms(2026, 1, 15),
  };
  const usdAsset: InvestmentAsset = {
    id: 'us',
    name: 'US Stocks',
    currentValue: 5_000,
    monthlyContribution: 0,
    currency: 'USD',
    asOfDate: ms(2026, 1, 15),
  };

  it('uses valueAsOfToday when horizon is 0', () => {
    const {projections} = calculateInvestmentProjections(
      [inrAsset],
      0,
      12,
      95,
      true,
      today,
    );
    expect(projections[0].futureValue).toBe(projections[0].valueAsOfToday);
  });

  it('has zero gain at horizon 0 with no accrual', () => {
    const freshAsset: InvestmentAsset = {
      ...inrAsset,
      asOfDate: today,
    };
    const {projections} = calculateInvestmentProjections(
      [freshAsset],
      0,
      12,
      95,
      true,
      today,
    );
    expect(projections[0].totalInvested).toBe(600_000);
    expect(projections[0].gain).toBe(0);
  });

  it('includes retrospective SIPs but excludes forward SIPs when includeSip is false', () => {
    const {projections} = calculateInvestmentProjections(
      [inrAsset],
      1,
      12,
      95,
      false,
      today,
    );
    expect(projections[0].accruedCreditMonths).toBe(5);
    expect(projections[0].totalInvested).toBe(600_000 + 80_000 * 5);
  });

  it('converts USD future value to INR', () => {
    const usdToInr = 95.24;
    const {projections} = calculateInvestmentProjections(
      [usdAsset],
      0,
      12,
      usdToInr,
      true,
      today,
    );
    expect(projections[0].futureValueInr).toBeCloseTo(
      projections[0].futureValue * usdToInr,
      2,
    );
  });

  it('keeps totalGainInr equal to totalInr minus totalInvestedInr', () => {
    const {totalInr, totalInvestedInr, totalGainInr} = calculateInvestmentProjections(
      [inrAsset, usdAsset],
      1,
      12,
      95,
      true,
      today,
    );
    expect(totalGainInr).toBeCloseTo(totalInr - totalInvestedInr, 2);
  });
});

describe('formatHorizonLabel', () => {
  it('returns Today for 0 years', () => {
    expect(formatHorizonLabel(0)).toBe('Today');
  });

  it('returns singular year label', () => {
    expect(formatHorizonLabel(1)).toBe('1 year');
  });

  it('returns plural years label', () => {
    expect(formatHorizonLabel(5)).toBe('5 years');
  });
});

describe('creditDateForCalendarMonth', () => {
  it('posts on the 3rd of the next month', () => {
    const credit = creditDateForCalendarMonth(2026, 0);
    const d = new Date(credit);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(SIP_CREDIT_DAY);
  });
});

describe('year-based FV wrappers', () => {
  it('calculates lump sum FV for years', () => {
    expect(calculateLumpSumFutureValue(1000, 12, 1)).toBeCloseTo(
      calculateLumpSumForMonths(1000, 12, 12),
      6,
    );
  });

  it('calculates SIP FV for years', () => {
    expect(calculateSipFutureValue(1000, 12, 1)).toBeCloseTo(
      calculateSipFutureValueForMonths(1000, 12, 12),
      6,
    );
  });

  it('returns principal when months are zero', () => {
    expect(calculateLumpSumForMonths(500, 12, 0)).toBe(500);
  });

  it('returns 0 SIP when contribution or months is zero', () => {
    expect(calculateSipFutureValueForMonths(0, 12, 12)).toBe(0);
    expect(calculateSipFutureValueForMonths(1000, 12, 0)).toBe(0);
  });

  it('handles zero interest SIP as simple product', () => {
    expect(calculateSipFutureValueForMonths(1000, 0, 5)).toBe(5000);
  });

  it('combines lump sum and SIP when includeSip is true', () => {
    const combined = calculateAssetFutureValue(10_000, 1000, 12, 1, true);
    const expected =
      calculateLumpSumFutureValue(10_000, 12, 1) + calculateSipFutureValue(1000, 12, 1);
    expect(combined).toBeCloseTo(expected, 6);
  });

  it('excludes SIP when includeSip is false', () => {
    expect(calculateAssetFutureValue(10_000, 1000, 12, 1, false)).toBeCloseTo(
      calculateLumpSumFutureValue(10_000, 12, 1),
      6,
    );
  });
});

describe('defaults and formatAsOfMonth', () => {
  it('exposes default investment config with assets', () => {
    expect(DEFAULT_INVESTMENT_CONFIG.assets.length).toBeGreaterThan(0);
    expect(DEFAULT_INVESTMENT_CONFIG.assumedReturnRate).toBe(12);
  });

  it('formats missing asOf as today', () => {
    expect(formatAsOfMonth(undefined)).toBe('today');
  });

  it('formats asOf month/year', () => {
    expect(formatAsOfMonth(ms(2026, 1, 15))).toMatch(/2026/);
  });
});
