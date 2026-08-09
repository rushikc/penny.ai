import {
  formatVendorName,
  generateUUID,
  getDateJsIdFormat,
  getDateMonth,
  getUnixTimestamp,
  isEmpty,
  JSONCopy,
  sortBy2Key,
  sortByKey,
} from '../../utility/utility';
import {getTagColor} from '../../utility/tagColors';
import {ms} from '../fixtures/factories';

describe('utility helpers', () => {
  it('detects empty strings', () => {
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty('   ')).toBe(true);
    expect(isEmpty('ok')).toBe(false);
  });

  it('formats vendor names for UPI and manual entry', () => {
    expect(formatVendorName('')).toBe('');
    expect(formatVendorName('Alice alice@upi')).toEqual(['alice', 'alice@upi']);
    expect(formatVendorName('foo manual entry bar')).toEqual(['manual entry']);
    expect(formatVendorName('Swiggy')).toEqual(['swiggy']);
    expect(formatVendorName('X manual entry X upi@bank')).toEqual(['manual entry', 'upi@bank']);
    expect(formatVendorName('John Doe john@oksbi')).toEqual(['john doe', 'john@oksbi']);
    // whitespace-only name side fails isEmpty and falls back to the full vendor string
    expect(formatVendorName('   upi@bank')).toEqual(['   upi@bank']);
  });

  it('sorts by numeric key descending', () => {
    const sorted = sortByKey(
      [
        {id: 'a', date: 1},
        {id: 'b', date: 3},
        {id: 'c', date: 2},
      ],
      'date',
    );
    expect(sorted.map(x => x.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorts by nested numeric key descending', () => {
    const sorted = sortBy2Key(
      [
        {id: 'a', meta: {score: 1}},
        {id: 'b', meta: {score: 3}},
        {id: 'c', meta: {score: 2}},
      ],
      'meta',
      'score',
    );
    expect(sorted.map(x => x.id)).toEqual(['b', 'c', 'a']);
  });

  it('deep copies via JSONCopy', () => {
    const src = {a: 1, nested: {b: 2}};
    const copy = JSONCopy(src);
    expect(copy).toEqual(src);
    expect(copy).not.toBe(src);
  });

  it('formats dates and unix timestamps', () => {
    expect(getDateMonth(ms(2026, 6, 8))).toMatch(/08 Jun/);
    expect(getUnixTimestamp('2020-01-01')).toBeGreaterThan(0);
    expect(getDateJsIdFormat(new Date(2026, 5, 8, 15, 30))).toMatch(/08 Jun 26/);
  });

  it('generates uuid-like strings', () => {
    const id = generateUUID();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});

describe('tagColors', () => {
  it('returns the neutral tag palette for any tag', () => {
    expect(getTagColor('Food')).toEqual(getTagColor('Travel'));
    expect(getTagColor(undefined).text).toBeTruthy();
    expect(getTagColor(null).tint).toBeTruthy();
  });
});
