import {
  aggregateValues,
  buildInsightsChartData,
  getCostRangeLabel,
  getDailySpending,
  getMonthlySpending,
  getTotalSpending,
} from '../../pages/insights/insightsCalculations';
import {makeExpense, ms} from '../fixtures/factories';

describe('aggregateValues', () => {
  it('returns 0 for empty values', () => {
    expect(aggregateValues([], 'average')).toBe(0);
    expect(aggregateValues([], 'median')).toBe(0);
  });

  it('computes average', () => {
    expect(aggregateValues([10, 20, 30], 'average')).toBe(20);
  });

  it('computes odd and even median', () => {
    expect(aggregateValues([10, 30, 20], 'median')).toBe(20);
    expect(aggregateValues([10, 40, 20, 30], 'median')).toBe(25);
  });
});

describe('spending summaries', () => {
  const expenses = [
    makeExpense({id: '1', mailId: '1', cost: 100, date: ms(2026, 6, 1)}),
    makeExpense({id: '2', mailId: '2', cost: 200, date: ms(2026, 6, 1)}),
    makeExpense({id: '3', mailId: '3', cost: 300, date: ms(2026, 5, 1)}),
  ];

  it('totals spending as a rounded string', () => {
    expect(getTotalSpending(expenses)).toBe('600');
    expect(getTotalSpending([])).toBe('0');
  });

  it('computes daily average and median', () => {
    expect(getDailySpending(expenses, 'average')).toBe('300');
    expect(getDailySpending(expenses, 'median')).toBe('300');
    expect(getDailySpending([], 'average')).toBe('0');
  });

  it('computes monthly average and median', () => {
    expect(getMonthlySpending(expenses, 'average')).toBe('300');
    expect(getMonthlySpending(expenses, 'median')).toBe('300');
    expect(getMonthlySpending([], 'median')).toBe('0');
  });
});

describe('chart grouping', () => {
  const expenses = [
    makeExpense({id: '1', mailId: '1', vendor: 'A', tag: 'Food', cost: 50, date: ms(2026, 6, 1)}),
    makeExpense({id: '2', mailId: '2', vendor: 'B', tag: 'Travel', cost: 150, date: ms(2026, 6, 1)}),
    makeExpense({id: '3', mailId: '3', vendor: 'C', tag: undefined, cost: 600, date: ms(2026, 6, 2)}),
    makeExpense({id: '4', mailId: '4', vendor: 'D', tag: 'Bills', cost: 1200, date: ms(2026, 6, 3)}),
    makeExpense({id: '5', mailId: '5', vendor: 'E', tag: 'Fun', cost: 80, date: ms(2026, 6, 4)}),
    makeExpense({id: '6', mailId: '6', vendor: 'F', tag: 'Health', cost: 90, date: ms(2026, 6, 5)}),
    makeExpense({id: '7', mailId: '7', vendor: 'G', tag: 'Extra', cost: 70, date: ms(2026, 6, 6)}),
  ];

  it('builds line chart data for days grouping', () => {
    const {lineChartData, lineKeys, pieChartData} = buildInsightsChartData(expenses, 'days');
    expect(lineKeys).toEqual(['Daily Total']);
    expect(pieChartData).toEqual([]);
    expect(lineChartData.some(p => p['Daily Total'] === 200)).toBe(true);
  });

  it('builds vendor pie top 5', () => {
    const {pieChartData, lineChartData} = buildInsightsChartData(expenses, 'vendor');
    expect(lineChartData).toEqual([]);
    expect(pieChartData).toHaveLength(5);
    expect(pieChartData[0]).toEqual({name: 'D', value: 1200});
  });

  it('filters untagged from tags pie and caps at 5', () => {
    const {pieChartData} = buildInsightsChartData(expenses, 'tags');
    expect(pieChartData.find(p => p.name === 'Untagged')).toBeUndefined();
    expect(pieChartData).toHaveLength(5);
  });

  it('groups pie by cost ranges', () => {
    const {pieChartData} = buildInsightsChartData(expenses, 'cost');
    expect(pieChartData.map(p => p.name)).toEqual(
      expect.arrayContaining(['₹0-₹100', '₹100-₹500', '₹500-₹1000', '₹1000+']),
    );
  });

  it('returns empty charts for empty expenses', () => {
    expect(buildInsightsChartData([], 'days')).toEqual({
      lineChartData: [],
      lineKeys: [],
      pieChartData: [],
    });
  });

  it('maps cost range labels', () => {
    expect(getCostRangeLabel(100)).toBe('₹0-₹100');
    expect(getCostRangeLabel(101)).toBe('₹100-₹500');
    expect(getCostRangeLabel(1000)).toBe('₹500-₹1000');
    expect(getCostRangeLabel(1001)).toBe('₹1000+');
  });
});
