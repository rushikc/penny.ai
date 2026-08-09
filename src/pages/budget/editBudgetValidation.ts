export const isBudgetFormValid = (
  budgetName: string,
  amount: string,
  selectedTags: string[],
): boolean =>
  budgetName.trim() !== '' &&
  !isNaN(parseFloat(amount)) &&
  parseFloat(amount) > 0 &&
  selectedTags.length > 0;
