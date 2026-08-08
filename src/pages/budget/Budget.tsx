import React, {useEffect, useState} from 'react';
import {View, StyleSheet, ScrollView, Pressable} from 'react-native';
import {Chip, FAB, Text} from 'react-native-paper';
import BottomSheetModal from '../../components/ui/BottomSheetModal';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useSelector} from 'react-redux';
import dayjs from 'dayjs';
import {selectExpense} from '../../store/expenseActions';
import {Budget, BudgetProgress, Expense, MonthYear} from '../../Types';
import Loading from '../../components/Loading';
import EditBudget from './EditBudget';
import {isEmpty} from '../../utility/utility';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppTheme} from '../../theme/useAppTheme';
import Card from '../../components/ui/Card';
import Tag from '../../components/ui/Tag';
import ProgressTrack from '../../components/ui/ProgressTrack';
import {spacing, typography} from '../../theme/tokens';

const BudgetPage: React.FC = () => {
  const theme = useAppTheme();
  const {expenseList, budgetList, isAppLoading} = useSelector(selectExpense);
  const [selectedMonth, setSelectedMonth] = useState<MonthYear | null>(null);
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [editBudgetOpen, setEditBudgetOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const filterExpensesByMonth = (expenses: Expense[], monthYear: MonthYear): Expense[] => {
    return expenses.filter(expense => {
      const d = dayjs(new Date(expense.date));
      return d.year() === monthYear.year && d.month() === monthYear.month;
    });
  };

  const calculateBudgetProgress = (expenses: Expense[], budgets: Budget[]): BudgetProgress[] => {
    return budgets.map(budget => {
      let spent: number;
      if (budget.tagList.includes('All')) {
        spent = expenses.filter(e => e.costType === 'debit').reduce((s, e) => s + e.cost, 0);
      } else {
        spent = expenses.filter(e => !isEmpty(e.tag)).filter(e => e.costType === 'debit')
          .filter(e => budget.tagList.some(tag => e.tag?.toLowerCase() === tag.toLowerCase()))
          .reduce((s, e) => s + e.cost, 0);
      }
      return {budget, spent, remaining: Math.max(0, budget.amount - spent), percentage: (spent / budget.amount) * 100};
    });
  };

  useEffect(() => {
    const now = dayjs();
    setSelectedMonth({month: now.month(), year: now.year(), label: `${monthNames[now.month()]} ${now.year()}`, value: `${now.year()}-${String(now.month() + 1).padStart(2, '0')}`});
  }, []);

  useEffect(() => {
    if (expenseList.length > 0 && budgetList.length > 0 && selectedMonth) {
      const filtered = filterExpensesByMonth(expenseList, selectedMonth);
      setBudgetProgress(calculateBudgetProgress(filtered, budgetList));
    }
    setLoading(false);
  }, [expenseList, budgetList, selectedMonth]);

  const getProgressColor = (pct: number) => pct < 85 ? theme.colors.primary : pct < 100 ? theme.colors.custom.warning : theme.colors.custom.danger;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0}).format(amount);

  const handleBudgetUpdated = () => { setSelectedBudget(null); setEditBudgetOpen(false); };
  const handleBudgetDeleted = (id: string) => {
    setBudgetProgress(prev => prev.filter(p => p.budget.id !== id));
    setSelectedBudget(null); setEditBudgetOpen(false);
  };

  const currentDate = dayjs();
  const years = [currentDate.year(), currentDate.year() - 1, currentDate.year() - 2];
  const maxMonth = selectedYear === currentDate.year() ? currentDate.month() : 11;
  const monthOptions: MonthYear[] = [];
  for (let m = 0; m <= maxMonth; m++) {
    monthOptions.push({month: m, year: selectedYear, label: `${monthNames[m]} ${selectedYear}`, value: `${selectedYear}-${String(m + 1).padStart(2, '0')}`});
  }

  if (isAppLoading || isLoading) return <Loading />;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]} edges={['top']}>
      <Text style={[styles.header, {color: theme.colors.onSurface}]}>Budget Overview</Text>

      <ScrollView contentContainerStyle={{paddingBottom: 100}}>
        {budgetProgress.map((progress) => {
          const isOver = progress.percentage >= 100;
          return (
            <Pressable key={progress.budget.id} onPress={() => { setSelectedBudget(progress.budget); setEditBudgetOpen(true); }}>
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.budgetName, {color: theme.colors.onSurface}]}>{progress.budget.name}</Text>
                  <Text style={[styles.amountPill, {color: theme.colors.onSurface, backgroundColor: theme.colors.surfaceVariant}]}>{formatCurrency(progress.budget.amount)}</Text>
                </View>
                <View style={styles.progressInfo}>
                  <Text variant="bodyMedium" style={{color: theme.colors.custom.danger, fontWeight: '600'}}>Spent: {formatCurrency(progress.spent)}</Text>
                  <Text variant="bodyMedium" style={{color: isOver ? theme.colors.custom.danger : theme.colors.custom.success, fontWeight: '600'}}>
                    {isOver ? 'Over' : 'Remaining'}: {formatCurrency(progress.remaining)}
                  </Text>
                </View>
                <ProgressTrack percentage={progress.percentage} />
                <Text style={[styles.progressPercent, {color: getProgressColor(progress.percentage)}]}>
                  {progress.percentage.toFixed(1)}%
                </Text>
                <View style={styles.tagRow}>
                  {progress.budget.tagList.map((tag, i) => (
                    <Tag key={i} label={tag} compact />
                  ))}
                </View>
              </Card>
            </Pressable>
          );
        })}

        {budgetProgress.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="wallet-outline" size={48} color={theme.colors.custom.textSecondary} />
            <Text variant="bodyLarge" style={{color: theme.colors.custom.textSecondary, marginTop: 12}}>No budget data available</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.floatingBar} pointerEvents="box-none">
        <Chip icon="filter-variant" onPress={() => setShowFilterModal(true)} style={[styles.floatChip, {backgroundColor: theme.colors.custom.card}]} elevated compact>
          {selectedMonth?.label || 'Select Month'}
        </Chip>
        <FAB icon="plus" style={[styles.fab, {backgroundColor: theme.colors.primary}]} color="#FFFFFF"
          onPress={() => { setSelectedBudget(null); setEditBudgetOpen(true); }} />
      </View>

      <BottomSheetModal
        visible={showFilterModal}
        onDismiss={() => setShowFilterModal(false)}
        title="Select Month"
        hideFooter
      >
        <Text variant="titleMedium" style={{marginBottom: 8}}>Year</Text>
        <View style={styles.chipGrid}>
          {years.map(y => <Chip key={y} selected={selectedYear === y} onPress={() => setSelectedYear(y)}>{y.toString()}</Chip>)}
        </View>
        <Text variant="titleMedium" style={{marginTop: 16, marginBottom: 8}}>Month</Text>
        <View style={styles.chipGrid}>
          {monthOptions.map(o => (
            <Chip key={o.value} selected={selectedMonth?.value === o.value}
              onPress={() => { setSelectedMonth(o); setShowFilterModal(false); }}>{o.label}</Chip>
          ))}
        </View>
      </BottomSheetModal>

      <EditBudget open={editBudgetOpen} onClose={() => setEditBudgetOpen(false)} budget={selectedBudget}
        onBudgetUpdated={handleBudgetUpdated} onBudgetDeleted={handleBudgetDeleted} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {...typography.screenTitle, marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.md},
  card: {marginHorizontal: spacing.md, marginBottom: spacing.md},
  cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md},
  budgetName: {...typography.cardTitle},
  amountPill: {...typography.caption, fontWeight: '600', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4},
  progressPercent: {...typography.caption, fontWeight: '600', textAlign: 'right', marginTop: 6},
  progressInfo: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm},
  tagRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md},
  emptyState: {alignItems: 'center', paddingTop: 80},
  floatingBar: {position: 'absolute', left: 0, right: 0, bottom: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg},
  floatChip: {borderRadius: 999},
  fab: {borderRadius: 32},
  chipGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
});

export default BudgetPage;
