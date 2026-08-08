import React, {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Chip, Divider, Text} from 'react-native-paper';
import BottomSheetModal from '../../components/ui/BottomSheetModal';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import {sortByKey} from '../../utility/utility';
import {LineGraph, PieGraph} from './Graph';
import Loading from '../../components/Loading';
import {DateRange, CalculationOption, calculationOptions, filterExpensesByDate, filterOptions, GroupByOption, groupByOptions} from '../dataValidations';
import {Expense} from '../../Types';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppTheme} from '../../theme/useAppTheme';
import GradientCard from '../../components/ui/GradientCard';
import Card from '../../components/ui/Card';
import {spacing, typography} from '../../theme/tokens';

interface LineDataPoint { date: string; [key: string]: string | number; }

const Insights: React.FC = () => {
  const theme = useAppTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<DateRange>('30d');
  const [selectedGroupBy, setSelectedGroupBy] = useState<GroupByOption>('days');
  const [selectedCalculation, setSelectedCalculation] = useState<CalculationOption>('median');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showGroupByModal, setShowGroupByModal] = useState(false);
  const [lineChartData, setLineChartData] = useState<LineDataPoint[]>([]);
  const [lineKeys, setLineKeys] = useState<string[]>([]);
  const [pieChartData, setPieChartData] = useState<{name: string; value: number}[]>([]);

  useEffect(() => {
    ExpenseAPI.getExpenseList().then(result => {
      setExpenses(sortByKey(result, 'date'));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getFilteredExpenses = useCallback(() => filterExpensesByDate(expenses, timeRange), [expenses, timeRange]);

  const getTotalSpending = () => getFilteredExpenses().reduce((sum, e) => sum + e.cost, 0).toFixed(0);

  const aggregate = (vals: number[]) => {
    if (vals.length === 0) return 0;
    if (selectedCalculation === 'average') return vals.reduce((s, v) => s + v, 0) / vals.length;
    const sorted = [...vals].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const getAverageDailySpending = () => {
    const filtered = getFilteredExpenses();
    if (filtered.length === 0) return '0';
    const byDay = new Map<string, number>();
    filtered.forEach(e => {
      const k = new Date(e.date).toLocaleDateString();
      byDay.set(k, (byDay.get(k) || 0) + e.cost);
    });
    return aggregate(Array.from(byDay.values())).toFixed(0);
  };

  const getMonthlySpending = () => {
    const filtered = getFilteredExpenses();
    if (filtered.length === 0) return '0';
    const byMonth = new Map<string, number>();
    filtered.forEach(e => {
      const d = new Date(e.date);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      byMonth.set(k, (byMonth.get(k) || 0) + e.cost);
    });
    return aggregate(Array.from(byMonth.values())).toFixed(0);
  };

  const getCostRange = useCallback((cost: number) => {
    if (cost <= 100) return '₹0-₹100';
    if (cost <= 500) return '₹100-₹500';
    if (cost <= 1000) return '₹500-₹1000';
    return '₹1000+';
  }, []);

  useEffect(() => {
    const filtered = getFilteredExpenses();
    if (filtered.length === 0) { setLineChartData([]); setPieChartData([]); setLineKeys([]); return; }

    const byDate = new Map<string, Expense[]>();
    filtered.forEach(e => {
      const d = new Date(e.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
      if (!byDate.has(d)) byDate.set(d, []);
      byDate.get(d)!.push(e);
    });

    if (selectedGroupBy === 'days') {
      const data: LineDataPoint[] = Array.from(byDate.entries()).map(([date, exps]) => ({
        date, 'Daily Total': exps.reduce((s, e) => s + e.cost, 0),
      }));
      data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setLineChartData(data);
      setLineKeys(['Daily Total']);
      setPieChartData([]);
    } else {
      const getKey = (e: Expense) => selectedGroupBy === 'vendor' ? e.vendor : selectedGroupBy === 'tags' ? (e.tag || 'Untagged') : getCostRange(e.cost);
      const metrics = new Map<string, number>();
      filtered.forEach(e => { const k = getKey(e); metrics.set(k, (metrics.get(k) || 0) + e.cost); });
      let groups = Array.from(metrics.entries()).sort((a, b) => b[1] - a[1]);
      if (selectedGroupBy === 'tags') groups = groups.filter(([k]) => k !== 'Untagged');
      const top5 = groups.slice(0, 5);
      setPieChartData(top5.map(([name, value]) => ({name, value})));
      setLineChartData([]);
      setLineKeys([]);
    }
  }, [expenses, timeRange, selectedGroupBy, selectedCalculation, getFilteredExpenses, getCostRange]);

  if (isLoading) return <Loading />;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]} edges={['top']}>
      <ScrollView contentContainerStyle={{paddingBottom: 100}}>
        <Text style={[styles.header, {color: theme.colors.onSurface}]}>Expense Insights</Text>

        <GradientCard style={styles.card}>
          <Text style={styles.heroLabel}>TOTAL SPENDING</Text>
          <Text style={styles.heroValue}>₹{getTotalSpending()}</Text>
          <View style={styles.metricFooter}>
            <MaterialCommunityIcons name="trending-up" size={14} color="rgba(255,255,255,0.85)" />
            <Text style={styles.heroSub}>{filterOptions.find(o => o.id === timeRange)?.label}</Text>
          </View>
        </GradientCard>

        <View style={styles.row}>
          <Card style={styles.smallCard}>
            <Text style={[styles.metricLabel, {color: theme.colors.custom.textSecondary}]}>
              DAILY {selectedCalculation === 'average' ? 'AVG' : 'MEDIAN'}
            </Text>
            <Text style={[styles.metricValue, {color: theme.colors.primary}]}>₹{getAverageDailySpending()}</Text>
            <Text style={[styles.metricSub, {color: theme.colors.custom.textSecondary}]}>Per Day</Text>
          </Card>
          <Card style={styles.smallCard}>
            <Text style={[styles.metricLabel, {color: theme.colors.custom.textSecondary}]}>
              MONTHLY {selectedCalculation === 'average' ? 'AVG' : 'MEDIAN'}
            </Text>
            <Text style={[styles.metricValue, {color: theme.colors.primary}]}>₹{getMonthlySpending()}</Text>
            <Text style={[styles.metricSub, {color: theme.colors.custom.textSecondary}]}>Per Month</Text>
          </Card>
        </View>

        {selectedGroupBy === 'days' ? (
          <LineGraph data={lineChartData} lineKeys={lineKeys} title="Spending Trends" />
        ) : (
          <PieGraph data={pieChartData} title="Group Distribution" />
        )}
      </ScrollView>

      <View style={styles.bottomBar} pointerEvents="box-none">
        <Chip icon="filter-variant" onPress={() => setShowFilterModal(true)} style={[styles.floatChip, {backgroundColor: theme.colors.custom.card}]} elevated compact>
          {filterOptions.find(o => o.id === timeRange)?.label}
        </Chip>
        <Chip icon="sort" onPress={() => setShowGroupByModal(true)} style={[styles.floatChip, {backgroundColor: theme.colors.custom.card}]} elevated compact>
          {groupByOptions.find(o => o.id === selectedGroupBy)?.label}
        </Chip>
      </View>

      <BottomSheetModal
        visible={showFilterModal}
        onDismiss={() => setShowFilterModal(false)}
        title="Filter by date range"
        hideFooter
      >
        <View style={styles.chipGrid}>
          {filterOptions.map(o => (
            <Chip key={o.id} selected={timeRange === o.id} onPress={() => { setTimeRange(o.id); setShowFilterModal(false); }}>{o.label}</Chip>
          ))}
        </View>
      </BottomSheetModal>

      <BottomSheetModal
        visible={showGroupByModal}
        onDismiss={() => setShowGroupByModal(false)}
        title="Group by"
        hideFooter
      >
        <View style={styles.chipGrid}>
          {groupByOptions.map(o => (
            <Chip key={o.id} selected={selectedGroupBy === o.id} onPress={() => { setSelectedGroupBy(o.id); setShowGroupByModal(false); }}>{o.label}</Chip>
          ))}
        </View>
        <Divider style={{marginVertical: 12}} />
        <Text style={[styles.modalSectionTitle, {color: theme.colors.onSurface}]}>Calculation</Text>
        <View style={styles.chipGrid}>
          {calculationOptions.map(o => (
            <Chip key={o.id} selected={selectedCalculation === o.id} onPress={() => { setSelectedCalculation(o.id); setShowGroupByModal(false); }}>{o.label}</Chip>
          ))}
        </View>
      </BottomSheetModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {...typography.screenTitle, marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.md},
  card: {marginHorizontal: spacing.md, marginBottom: spacing.md},
  row: {flexDirection: 'row', gap: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.md},
  smallCard: {flex: 1},
  heroLabel: {...typography.label, color: 'rgba(255,255,255,0.85)'},
  heroValue: {...typography.amountHero, color: '#FFFFFF', marginTop: spacing.xs},
  heroSub: {...typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs},
  metricLabel: {...typography.label},
  metricValue: {...typography.amount, marginTop: spacing.xs},
  metricSub: {...typography.caption, marginTop: spacing.xs},
  metricFooter: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs},
  modalSectionTitle: {...typography.cardTitle, marginBottom: spacing.sm},
  bottomBar: {position: 'absolute', left: 0, right: 0, bottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg},
  floatChip: {borderRadius: 999},
  chipGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
});

export default Insights;
