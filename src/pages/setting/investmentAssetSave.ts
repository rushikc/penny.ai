import {InvestmentAsset} from '../../Types';

export const buildSavedInvestmentAsset = (
  asset: InvestmentAsset,
  existingAssets: InvestmentAsset[],
  nowMs: number = Date.now(),
): {savedAsset: InvestmentAsset; nextAssets: InvestmentAsset[]; isExisting: boolean} => {
  const existing = existingAssets.find(item => item.id === asset.id);
  const isExisting = Boolean(existing);

  const valueChanged = existing ? existing.currentValue !== asset.currentValue : true;
  const sipChanged = existing
    ? existing.monthlyContribution !== asset.monthlyContribution
    : true;

  const savedAsset: InvestmentAsset = {
    ...asset,
    asOfDate:
      !isExisting || valueChanged || sipChanged
        ? nowMs
        : existing?.asOfDate,
  };

  const nextAssets = isExisting
    ? existingAssets.map(item => (item.id === savedAsset.id ? savedAsset : item))
    : [...existingAssets, savedAsset];

  return {savedAsset, nextAssets, isExisting};
};
