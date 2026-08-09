export const isInvestmentAssetFormValid = (input: {
  name: string;
  currentValue: string;
  monthlyContribution: string;
  useCustomReturn: boolean;
  annualReturnRate: string;
}): boolean => {
  const parsedCurrentValue = parseFloat(input.currentValue);
  const parsedMonthlyContribution = parseFloat(input.monthlyContribution || '0');
  const parsedReturnRate = parseFloat(input.annualReturnRate);

  return (
    input.name.trim() !== '' &&
    !Number.isNaN(parsedCurrentValue) &&
    parsedCurrentValue >= 0 &&
    !Number.isNaN(parsedMonthlyContribution) &&
    parsedMonthlyContribution >= 0 &&
    (!input.useCustomReturn ||
      (!Number.isNaN(parsedReturnRate) && parsedReturnRate >= 0 && parsedReturnRate <= 100))
  );
};
