import {isBudgetFormValid} from '../../pages/budget/editBudgetValidation';

describe('isBudgetFormValid', () => {
  it('accepts a trimmed name, positive amount, and at least one tag', () => {
    expect(isBudgetFormValid(' Food ', '100', ['Food'])).toBe(true);
  });

  it('rejects empty name, non-positive amount, or missing tags', () => {
    expect(isBudgetFormValid('', '100', ['Food'])).toBe(false);
    expect(isBudgetFormValid('   ', '100', ['Food'])).toBe(false);
    expect(isBudgetFormValid('Food', '', ['Food'])).toBe(false);
    expect(isBudgetFormValid('Food', 'abc', ['Food'])).toBe(false);
    expect(isBudgetFormValid('Food', '0', ['Food'])).toBe(false);
    expect(isBudgetFormValid('Food', '-5', ['Food'])).toBe(false);
    expect(isBudgetFormValid('Food', '100', [])).toBe(false);
  });
});
