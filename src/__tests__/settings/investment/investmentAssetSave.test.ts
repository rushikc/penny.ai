import {buildSavedInvestmentAsset} from '../../../pages/setting/investmentAssetSave';
import {makeInvestmentAsset, ms} from '../../fixtures/factories';

describe('buildSavedInvestmentAsset', () => {
  const now = ms(2026, 6, 15);

  it('bumps asOfDate and appends when adding a new asset', () => {
    const asset = makeInvestmentAsset({id: 'new', asOfDate: undefined});
    const {savedAsset, nextAssets, isExisting} = buildSavedInvestmentAsset(asset, [], now);
    expect(isExisting).toBe(false);
    expect(savedAsset.asOfDate).toBe(now);
    expect(nextAssets).toHaveLength(1);
  });

  it('bumps asOfDate when current value changes', () => {
    const existing = makeInvestmentAsset({
      id: 'mf',
      currentValue: 100,
      monthlyContribution: 10,
      asOfDate: ms(2026, 1, 1),
    });
    const edited = {...existing, currentValue: 200};
    const {savedAsset, isExisting} = buildSavedInvestmentAsset(edited, [existing], now);
    expect(isExisting).toBe(true);
    expect(savedAsset.asOfDate).toBe(now);
  });

  it('bumps asOfDate when monthly SIP changes', () => {
    const existing = makeInvestmentAsset({
      id: 'mf',
      currentValue: 100,
      monthlyContribution: 10,
      asOfDate: ms(2026, 1, 1),
    });
    const edited = {...existing, monthlyContribution: 20};
    const {savedAsset} = buildSavedInvestmentAsset(edited, [existing], now);
    expect(savedAsset.asOfDate).toBe(now);
  });

  it('keeps asOfDate when only name or return rate changes', () => {
    const existing = makeInvestmentAsset({
      id: 'mf',
      name: 'Old',
      currentValue: 100,
      monthlyContribution: 10,
      asOfDate: ms(2026, 1, 1),
      annualReturnRate: 8,
    });
    const edited = {...existing, name: 'New', annualReturnRate: 9};
    const {savedAsset, nextAssets} = buildSavedInvestmentAsset(edited, [existing], now);
    expect(savedAsset.asOfDate).toBe(ms(2026, 1, 1));
    expect(nextAssets).toHaveLength(1);
    expect(nextAssets[0].name).toBe('New');
  });

  it('replaces an existing asset in the list by id', () => {
    const a = makeInvestmentAsset({id: 'a', name: 'A'});
    const b = makeInvestmentAsset({id: 'b', name: 'B'});
    const edited = {...b, name: 'B2', currentValue: b.currentValue + 1};
    const {nextAssets} = buildSavedInvestmentAsset(edited, [a, b], now);
    expect(nextAssets.map(item => item.name)).toEqual(['A', 'B2']);
  });
});
