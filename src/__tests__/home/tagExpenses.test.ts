import {
  buildTaggedExpense,
  canSaveTaggedExpense,
  resolveAutoTagMapping,
} from '../../pages/home/tagExpenseUtils';
import {makeExpense, makeVendorTag, ms} from '../fixtures/factories';

describe('canSaveTaggedExpense', () => {
  it('requires a non-empty tag', () => {
    expect(canSaveTaggedExpense('')).toBe(false);
    expect(canSaveTaggedExpense('   ')).toBe(false);
    expect(canSaveTaggedExpense('Food')).toBe(true);
  });
});

describe('resolveAutoTagMapping', () => {
  const expense = makeExpense({vendor: 'Swiggy', tag: 'Food'});

  it('does nothing when selected tag is empty', () => {
    expect(resolveAutoTagMapping(expense, '', [])).toEqual({
      shouldCreateMapping: false,
      tagObj: null,
    });
  });

  it('skips create when an exact vendor+old-tag mapping already exists', () => {
    const existing = makeVendorTag({vendor: 'Swiggy', tag: 'Food'});
    const result = resolveAutoTagMapping(expense, 'Dining', [existing], ms(2026, 6, 1));
    expect(result.shouldCreateMapping).toBe(false);
    expect(result.tagObj).toEqual(existing);
  });

  it('creates a new mapping when none matches vendor and old tag', () => {
    const result = resolveAutoTagMapping(
      expense,
      'Dining',
      [makeVendorTag({vendor: 'Swiggy', tag: 'Other'})],
      ms(2026, 6, 1),
    );
    expect(result.shouldCreateMapping).toBe(true);
    expect(result.tagObj).toEqual({
      id: 'Swiggy',
      vendor: 'Swiggy',
      tag: 'Dining',
      date: ms(2026, 6, 1),
    });
  });
});

describe('buildTaggedExpense', () => {
  it('copies the expense and applies the selected tag', () => {
    const expense = makeExpense({tag: 'Food', cost: 120});
    const tagged = buildTaggedExpense(expense, 'Travel');
    expect(tagged).not.toBe(expense);
    expect(tagged.tag).toBe('Travel');
    expect(tagged.cost).toBe(120);
  });
});
