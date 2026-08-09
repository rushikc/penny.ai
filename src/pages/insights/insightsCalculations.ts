import {CalculationOption, GroupByOption} from '../dataValidations';
import {Expense} from '../../Types';

export interface LineDataPoint {
  date: string;
  [key: string]: string | number;
}

export const aggregateValues = (
  vals: number[],
  calculation: CalculationOption,
): number => {
  if (vals.length === 0) return 0;
  if (calculation === 'average') return vals.reduce((s, v) => s + v, 0) / vals.length;
  const sorted = [...vals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export const getTotalSpending = (expenses: Expense[]): string =>
  expenses.reduce((sum, e) => sum + e.cost, 0).toFixed(0);

export const getDailySpending = (
  expenses: Expense[],
  calculation: CalculationOption,
): string => {
  if (expenses.length === 0) return '0';
  const byDay = new Map<string, number>();
  expenses.forEach(e => {
    const k = new Date(e.date).toLocaleDateString();
    byDay.set(k, (byDay.get(k) || 0) + e.cost);
  });
  return aggregateValues(Array.from(byDay.values()), calculation).toFixed(0);
};

export const getMonthlySpending = (
  expenses: Expense[],
  calculation: CalculationOption,
): string => {
  if (expenses.length === 0) return '0';
  const byMonth = new Map<string, number>();
  expenses.forEach(e => {
    const d = new Date(e.date);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    byMonth.set(k, (byMonth.get(k) || 0) + e.cost);
  });
  return aggregateValues(Array.from(byMonth.values()), calculation).toFixed(0);
};

export const getCostRangeLabel = (cost: number): string => {
  if (cost <= 100) return '₹0-₹100';
  if (cost <= 500) return '₹100-₹500';
  if (cost <= 1000) return '₹500-₹1000';
  return '₹1000+';
};

export const buildLineChartData = (
  expenses: Expense[],
): {lineChartData: LineDataPoint[]; lineKeys: string[]} => {
  const byDate = new Map<string, Expense[]>();
  expenses.forEach(e => {
    const d = new Date(e.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(e);
  });

  const lineChartData: LineDataPoint[] = Array.from(byDate.entries()).map(([date, exps]) => ({
    date,
    'Daily Total': exps.reduce((s, e) => s + e.cost, 0),
  }));
  lineChartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {lineChartData, lineKeys: ['Daily Total']};
};

export const buildPieChartData = (
  expenses: Expense[],
  selectedGroupBy: Exclude<GroupByOption, 'days'>,
): {name: string; value: number}[] => {
  const getKey = (e: Expense) =>
    selectedGroupBy === 'vendor'
      ? e.vendor
      : selectedGroupBy === 'tags'
        ? (e.tag || 'Untagged')
        : getCostRangeLabel(e.cost);

  const metrics = new Map<string, number>();
  expenses.forEach(e => {
    const k = getKey(e);
    metrics.set(k, (metrics.get(k) || 0) + e.cost);
  });

  let groups = Array.from(metrics.entries()).sort((a, b) => b[1] - a[1]);
  if (selectedGroupBy === 'tags') {
    groups = groups.filter(([k]) => k !== 'Untagged');
  }

  return groups.slice(0, 5).map(([name, value]) => ({name, value}));
};

export const buildInsightsChartData = (
  expenses: Expense[],
  selectedGroupBy: GroupByOption,
): {
  lineChartData: LineDataPoint[];
  lineKeys: string[];
  pieChartData: {name: string; value: number}[];
} => {
  if (expenses.length === 0) {
    return {lineChartData: [], lineKeys: [], pieChartData: []};
  }

  if (selectedGroupBy === 'days') {
    const {lineChartData, lineKeys} = buildLineChartData(expenses);
    return {lineChartData, lineKeys, pieChartData: []};
  }

  return {
    lineChartData: [],
    lineKeys: [],
    pieChartData: buildPieChartData(expenses, selectedGroupBy),
  };
};
