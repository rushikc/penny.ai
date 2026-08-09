import {isInvestmentAssetFormValid} from '../../../pages/setting/editInvestmentValidation';

describe('isInvestmentAssetFormValid', () => {
  const valid = {
    name: 'Mutual Funds',
    currentValue: '1000',
    monthlyContribution: '100',
    useCustomReturn: false,
    annualReturnRate: '',
  };

  it('accepts valid assets including empty monthly contribution as zero', () => {
    expect(isInvestmentAssetFormValid(valid)).toBe(true);
    expect(isInvestmentAssetFormValid({...valid, monthlyContribution: ''})).toBe(true);
    expect(isInvestmentAssetFormValid({...valid, currentValue: '0'})).toBe(true);
  });

  it('rejects invalid name or negative amounts', () => {
    expect(isInvestmentAssetFormValid({...valid, name: '  '})).toBe(false);
    expect(isInvestmentAssetFormValid({...valid, currentValue: '-1'})).toBe(false);
    expect(isInvestmentAssetFormValid({...valid, monthlyContribution: '-1'})).toBe(false);
    expect(isInvestmentAssetFormValid({...valid, currentValue: 'abc'})).toBe(false);
  });

  it('validates custom return rates between 0 and 100', () => {
    expect(
      isInvestmentAssetFormValid({...valid, useCustomReturn: true, annualReturnRate: '8.25'}),
    ).toBe(true);
    expect(
      isInvestmentAssetFormValid({...valid, useCustomReturn: true, annualReturnRate: '0'}),
    ).toBe(true);
    expect(
      isInvestmentAssetFormValid({...valid, useCustomReturn: true, annualReturnRate: '100'}),
    ).toBe(true);
    expect(
      isInvestmentAssetFormValid({...valid, useCustomReturn: true, annualReturnRate: '-1'}),
    ).toBe(false);
    expect(
      isInvestmentAssetFormValid({...valid, useCustomReturn: true, annualReturnRate: '101'}),
    ).toBe(false);
    expect(
      isInvestmentAssetFormValid({...valid, useCustomReturn: true, annualReturnRate: ''}),
    ).toBe(false);
  });
});
