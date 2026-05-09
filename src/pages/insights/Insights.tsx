import React, {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Chip, Surface, Text, useTheme, Portal, Modal, Divider, Button} from 'react-native-paper';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import {sortByKey} from '../../utility/utility';
import {LineGraph, PieGraph} from './Graph';
import Loading from '../../components/Loading';
import {DateRange, CalculationOption, calculationOptions, filterExpensesByDate, filterOptions, GroupByOption, groupByOptions} from '../dataValidations';
import {Expense} from '../../Types';
import {SafeAreaView} from 'react-native-safe-area-context';

interface LineDataPoint { date: string; [key: string]: string | number; }

const Insights: React.FC = () => {
  const theme = useTheme();
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

  const getAverageDailySpending = () => {
    const filtered = getFilteredExpenses();
    if (filtered.length === 0) return '0';
    const byDay = new Map<string, number>();
    filtered.forEach(e => {
      const k = new Date(e.date).toLocaleDateString();
      byDay.set(k, (byDay.get(k) || 0) + e.cost);
    });
    const vals = Array.from(byDay.values());
    if (selectedCalculation === 'average') return (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(0);
    const sorted = [...vals].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return (sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2).toFixed(0);
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
        <Text variant="headlineSmall" style={[styles.header, {color: theme.colors.onSurface}]}>Expense Insights</Text>

        <Surface style={[styles.card, {backgroundColor: theme.colors.primary}]} elevation={3}>
          <Text variant="labelMedium" style={{color: 'rgba(255,255,255,0.7)'}}>Total Spending</Text>
          <Text variant="headlineMedium" style={{color: 'white', fontWeight: 'bold'}}>₹{getTotalSpending()}</Text>
          <Text variant="labelSmall" style={{color: 'rgba(255,255,255,0.7)'}}>
            {filterOptions.find(o => o.id === timeRange)?.label}
          </Text>
        </Surface>

        <View style={styles.row}>
          <Surface style={[styles.smallCard, {backgroundColor: '#4caf50'}]} elevation={2}>
            <Text variant="labelSmall" style={{color: 'rgba(255,255,255,0.7)'}}>Daily {selectedCalculation === 'average' ? 'Avg' : 'Median'}</Text>
            <Text variant="titleLarge" style={{color: 'white', fontWeight: 'bold'}}>₹{getAverageDailySpending()}</Text>
          </Surface>
          <Surface style={[styles.smallCard, {backgroundColor: '#ff9800'}]} elevation={2}>
            <Text variant="labelSmall" style={{color: 'rgba(255,255,255,0.7)'}}>Expenses</Text>
            <Text variant="titleLarge" style={{color: 'white', fontWeight: 'bold'}}>{getFilteredExpenses().length}</Text>
          </Surface>
        </View>

        {selectedGroupBy === 'days' ? (
          <LineGraph data={lineChartData} lineKeys={lineKeys} title="Spending Trends" />
        ) : (
          <PieGraph data={pieChartData} title="Group Distribution" />
        )}
      </ScrollView>

      <View style={[styles.bottomBar, {backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant}]}>
        <Chip icon="filter-variant" onPress={() => setShowFilterModal(true)} compact>
          {filterOptions.find(o => o.id === timeRange)?.label}
        </Chip>
        <Chip icon="sort" onPress={() => setShowGroupByModal(true)} compact>
          {groupByOptions.find(o => o.id === selectedGroupBy)?.label}
        </Chip>
      </View>

      <Portal>
        <Modal visible={showFilterModal} onDismiss={() => setShowFilterModal(false)} contentContainerStyle={[styles.modal, {backgroundColor: theme.colors.surface}]}>
          <Text variant="titleMedium" style={{marginBottom: 12}}>Filter by date range</Text>
          <View style={styles.chipGrid}>
            {filterOptions.map(o => (
              <Chip key={o.id} selected={timeRange === o.id} onPress={() => { setTimeRange(o.id); setShowFilterModal(false); }}>{o.label}</Chip>
            ))}
          </View>
        </Modal>
        <Modal visible={showGroupByModal} onDismiss={() => setShowGroupByModal(false)} contentContainerStyle={[styles.modal, {backgroundColor: theme.colors.surface}]}>
          <Text variant="titleMedium" style={{marginBottom: 8}}>Group by</Text>
          <View style={styles.chipGrid}>
            {groupByOptions.map(o => (
              <Chip key={o.id} selected={selectedGroupBy === o.id} onPress={() => { setSelectedGroupBy(o.id); setShowGroupByModal(false); }}>{o.label}</Chip>
            ))}
          </View>
          <Divider style={{marginVertical: 12}} />
          <Text variant="titleMedium" style={{marginBottom: 8}}>Calculation</Text>
          <View style={styles.chipGrid}>
            {calculationOptions.map(o => (
              <Chip key={o.id} selected={selectedCalculation === o.id} onPress={() => { setSelectedCalculation(o.id); setShowGroupByModal(false); }}>{o.label}</Chip>
            ))}
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {fontWeight: 'bold', margin: 16},
  card: {marginHorizontal: 12, padding: 16, borderRadius: 12, marginBottom: 8},
  row: {flexDirection: 'row', gap: 8, marginHorizontal: 12, marginBottom: 8},
  smallCard: {flex: 1, padding: 14, borderRadius: 12},
  bottomBar: {flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, gap: 8},
  modal: {margin: 20, padding: 20, borderRadius: 16},
  chipGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
});

export default Insights;
