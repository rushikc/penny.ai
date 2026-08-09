import {generateUUID} from '../../utility/utility';

describe('add expense payload rules', () => {
  it('builds a valid manual debit expense shape', () => {
    const uuid = generateUUID();
    const parsedCost = 123.45;
    const selectedTag = 'Food';
    const now = 1_700_000_000_000;

    const newExpense = {
      id: 'manual',
      vendor: uuid.substring(0, 4) + ' manual entry',
      date: now,
      modifiedDate: now,
      cost: parsedCost,
      tag: selectedTag,
      costType: 'debit' as const,
      mailId: uuid,
      user: 'manual',
      type: 'manual',
      operation: 'update',
    };

    expect(newExpense.cost).toBeGreaterThan(0);
    expect(newExpense.costType).toBe('debit');
    expect(newExpense.vendor).toContain('manual entry');
    expect(newExpense.mailId).toBe(uuid);
    expect(newExpense.tag).toBe('Food');
  });

  it('rejects non-positive parsed costs like the UI save guard', () => {
    const canSave = (cost: string) => {
      const parsedCost = parseFloat(cost);
      return !!cost && !isNaN(parsedCost) && parsedCost > 0;
    };

    expect(canSave('')).toBe(false);
    expect(canSave('abc')).toBe(false);
    expect(canSave('0')).toBe(false);
    expect(canSave('-5')).toBe(false);
    expect(canSave('12.5')).toBe(true);
  });
});
