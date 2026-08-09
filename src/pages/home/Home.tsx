import React, {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet, Pressable, ScrollView} from 'react-native';
import {Chip, FAB, Text, Portal, Modal, Divider} from 'react-native-paper';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useSelector} from 'react-redux';
import dayjs from 'dayjs';
import {Expense, MonthYear} from '../../Types';
import Loading from '../../components/Loading';
import {deleteExpense, mergeSaveExpense, selectExpense, setExpenseList, setTagExpense} from '../../store/expenseActions';
import {formatVendorName, getDateMonth, sortByKey} from '../../utility/utility';
import {
  createMonthYear,
  filterExpensesByHomeDateFilter,
  getDefaultHomeDateFilter,
  GroupByOption,
  groupByOptions,
  GroupedExpenses,
  groupExpenses,
  HomeDateFilter,
  RelativeDateRange,
  relativeFilterOptions,
  searchExpenses,
  SortByOption,
  sortByOptions,
} from '../dataValidations';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import TagExpenses from './TagExpenses';
import AddExpense from './AddExpense';
import MergeExpenses from './MergeExpenses';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppTheme} from '../../theme/useAppTheme';
import Card from '../../components/ui/Card';
import Tag from '../../components/ui/Tag';
import SearchField from '../../components/ui/SearchField';
import {spacing} from '../../theme/tokens';

const Home: React.FC = () => {
  const theme = useAppTheme();
  const {expenseList, isAppLoading, isTagModal} = useSelector(selectExpense);
  const [dateFilter, setDateFilter] = useState<HomeDateFilter>(getDefaultHomeDateFilter);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilteredExpenses, setDateFilteredExpenses] = useState<Expense[]>([]);
  const [groupedExpenses, setGroupedExpenses] = useState<GroupedExpenses>({});
  const [collapsedGroups, setCollapsedGroups] = useState<{[key: string]: boolean}>({});
  const [selectedGroupBy, setSelectedGroupBy] = useState<GroupByOption>('days');
  const [selectedSortBy, setSelectedSortBy] = useState<SortByOption>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<Expense[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showGroupByModal, setShowGroupByModal] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => { setLoading(isAppLoading); }, [isAppLoading]);

  useEffect(() => {
    if (dateFilter.mode === 'month') {
      setSelectedYear(dateFilter.monthYear.year);
    }
  }, [dateFilter]);

  useEffect(() => {
    if (expenseList.length === 0) { setDateFilteredExpenses([]); return; }
    const filtered = filterExpensesByHomeDateFilter(expenseList, dateFilter);
    setDateFilteredExpenses(sortByKey(filtered, 'date'));
  }, [expenseList, dateFilter]);

  useEffect(() => {
    setFilteredExpenses(searchExpenses(dateFilteredExpenses, searchTerm));
  }, [dateFilteredExpenses, searchTerm]);

  useEffect(() => {
    if (filteredExpenses.length === 0) { setGroupedExpenses({}); return; }
    const grouped = groupExpenses(filteredExpenses, selectedGroupBy);
    const newCollapsed: {[key: string]: boolean} = {};
    Object.keys(grouped).forEach(k => { newCollapsed[k] = selectedGroupBy !== 'days'; });
    setCollapsedGroups(newCollapsed);
    setGroupedExpenses(grouped);
    setLoading(false);
  }, [filteredExpenses, selectedGroupBy, selectedSortBy]);

  const toggleExpenseSelection = useCallback((expense: Expense) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedExpenses([expense]);
    } else {
      const isSelected = selectedExpenses.some(e => e.id === expense.id);
      if (isSelected) {
        const newSelected = selectedExpenses.filter(e => e.id !== expense.id);
        setSelectedExpenses(newSelected);
        if (newSelected.length === 0) setSelectionMode(false);
      } else {
        setSelectedExpenses([...selectedExpenses, expense]);
      }
    }
  }, [selectionMode, selectedExpenses]);

  const cancelSelection = useCallback(() => {
    setSelectedExpenses([]);
    setSelectionMode(false);
  }, []);

  const handleDeleteSelected = async () => {
    if (selectedExpenses.length === 0) return;
    setLoading(true);
    try {
      const deletePromises = selectedExpenses.map(expense => ExpenseAPI.addExpense(expense, 'delete'));
      await Promise.all(deletePromises);
      selectedExpenses.forEach(expense => deleteExpense(expense));
    } catch (error) {
      console.error('Error deleting expenses:', error);
    } finally {
      cancelSelection();
      setTimeout(() => {
        ExpenseAPI.getExpenseList().then(expenses => {
          setExpenseList(sortByKey(expenses, 'date'));
          setLoading(false);
        });
      }, 500);
    }
  };

  const handleMergeComplete = (mergedExpense: Expense) => {
    setShowMergeDialog(false);
    mergeSaveExpense(selectedExpenses, mergedExpense);
    cancelSelection();
  };

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups(prev => ({...prev, [groupKey]: !prev[groupKey]}));
  };

  const selectMonth = (monthYear: MonthYear) => {
    setDateFilter({mode: 'month', monthYear});
    setShowFilterModal(false);
  };

  const selectRelativeRange = (range: RelativeDateRange) => {
    setDateFilter({mode: 'relative', range});
    setShowFilterModal(false);
  };

  const currentDate = dayjs();
  const years = [currentDate.year(), currentDate.year() - 1, currentDate.year() - 2];
  const maxMonth = selectedYear === currentDate.year() ? currentDate.month() : 11;
  const monthOptions: MonthYear[] = [];
  for (let m = 0; m <= maxMonth; m++) {
    monthOptions.push(createMonthYear(m, selectedYear));
  }

  const sortedGroupKeys = Object.entries(groupedExpenses)
    .sort(([keyA, a], [keyB, b]) => {
      if (selectedGroupBy === 'days' && (selectedSortBy === 'date' || selectedSortBy == null))
        return keyB.localeCompare(keyA);
      return selectedSortBy === 'cost' ? b.totalAmount - a.totalAmount : b.expenses.length - a.expenses.length;
    })
    .map(([key]) => key);

  const renderExpenseItem = (expense: Expense, isFirst: boolean) => {
    const isSelected = selectedExpenses.some(e => e.id === expense.id);
    const vendorNames = formatVendorName(expense.vendor);
    const isCredit = expense.costType === 'credit';
    return (
      <Pressable
        key={expense.mailId}
        onPress={() => selectionMode ? toggleExpenseSelection(expense) : setTagExpense(expense)}
        onLongPress={() => toggleExpenseSelection(expense)}
        delayLongPress={500}
        style={[
          styles.expenseRow,
          !isFirst && {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.custom.border},
          isSelected && {backgroundColor: theme.colors.surfaceVariant},
        ]}
      >
        <View style={[styles.avatar, {backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceVariant}]}>
          <MaterialCommunityIcons
            name={isSelected ? 'check' : expense.type === 'credit-card' ? 'credit-card' : 'currency-inr'}
            size={20}
            color={isSelected ? '#FFFFFF' : theme.colors.custom.textSecondary}
          />
        </View>
        <View style={styles.expenseContent}>
          <Text variant="bodyLarge" numberOfLines={1} style={[styles.vendorName, {color: theme.colors.onSurface}]}>
            {vendorNames[0]}
          </Text>
          <View style={styles.metaRow}>
            <Text variant="bodySmall" style={{color: theme.colors.custom.textSecondary}}>{getDateMonth(expense.date)}</Text>
            <Tag label={expense.tag || 'untagged'} compact />
          </View>
        </View>
        <Text style={[styles.amount, {color: isCredit ? theme.colors.custom.success : theme.colors.onSurface}]}>
          {isCredit ? '+' : ''}₹{expense.cost}
        </Text>
      </Pressable>
    );
  };

  if (isLoading) return <Loading />;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]} edges={['top']}>
      <View style={styles.searchWrap}>
        <SearchField
          placeholder="Search expenses..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <ScrollView style={styles.list} contentContainerStyle={{paddingBottom: 120}}>
        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="cash-remove" size={48} color={theme.colors.custom.textSecondary} />
            <Text variant="bodyLarge" style={{color: theme.colors.custom.textSecondary, marginTop: 12}}>
              {searchTerm ? 'No matching expenses' : 'No expenses found'}
            </Text>
          </View>
        ) : (
          sortedGroupKeys.map(groupKey => {
            const groupData = groupedExpenses[groupKey];
            const isCollapsed = collapsedGroups[groupKey];
            return (
              <Card key={groupKey} noPadding style={styles.groupCard}>
                <Pressable style={styles.groupHeader} onPress={() => toggleGroupCollapse(groupKey)}>
                  <View style={{flex: 1}}>
                    <Text variant="titleMedium" style={{color: theme.colors.onSurface, fontWeight: '700'}}>
                      {selectedGroupBy === 'days' ? groupData.groupLabel : groupData.groupLabel.toLowerCase()}
                    </Text>
                    <Text variant="bodySmall" style={{color: theme.colors.custom.textSecondary}}>
                      {groupData.expenses.length} expense{groupData.expenses.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={[styles.groupTotal, {color: theme.colors.onSurface}]}>
                    ₹{Math.abs(groupData.totalAmount).toFixed(0)}
                  </Text>
                  <MaterialCommunityIcons
                    name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                    size={20}
                    color={theme.colors.custom.textSecondary}
                  />
                </Pressable>
                {!isCollapsed && (
                  <View style={[styles.rowGroup, {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.custom.border}]}>
                    {groupData.expenses.map((expense, index) => renderExpenseItem(expense, index === 0))}
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      {selectionMode ? (
        <View style={styles.floatingBar} pointerEvents="box-none">
          <View style={[styles.selectionBar, {backgroundColor: theme.colors.custom.card}]}>
            <Chip icon="close" onPress={cancelSelection} style={styles.chip} compact>{selectedExpenses.length} selected</Chip>
            <Chip icon="delete" onPress={handleDeleteSelected} style={[styles.chip, {backgroundColor: theme.colors.errorContainer}]} compact>Delete</Chip>
            {selectedExpenses.length >= 2 && (
              <Chip icon="merge" onPress={() => setShowMergeDialog(true)} style={styles.chip} compact>Merge</Chip>
            )}
          </View>
        </View>
      ) : (
        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? 'close' : 'plus'}
          accessibilityLabel={fabOpen ? 'Close actions' : 'Open actions'}
          fabStyle={[styles.fab, {backgroundColor: theme.colors.primary}]}
          color="#FFFFFF"
          backdropColor="rgba(0, 0, 0, 0.32)"
          style={styles.fabGroup}
          onStateChange={({open}) => setFabOpen(open)}
          actions={[
            {
              icon: 'calendar-range',
              label: 'Date range',
              color: theme.colors.primary,
              style: {backgroundColor: theme.colors.custom.card},
              labelTextColor: theme.colors.onSurface,
              onPress: () => setShowFilterModal(true),
            },
            {
              icon: 'sort',
              label: 'Sort by',
              color: theme.colors.primary,
              style: {backgroundColor: theme.colors.custom.card},
              labelTextColor: theme.colors.onSurface,
              onPress: () => setShowGroupByModal(true),
            },
            {
              icon: 'plus',
              label: 'Add expense',
              color: theme.colors.primary,
              style: {backgroundColor: theme.colors.custom.card},
              labelTextColor: theme.colors.onSurface,
              onPress: () => setShowAddExpenseDialog(true),
            },
          ]}
        />
      )}

      {/* Date filter: calendar month (budget-style) + relative ranges */}
      <Portal>
        <Modal visible={showFilterModal} onDismiss={() => setShowFilterModal(false)} contentContainerStyle={[styles.modal, {backgroundColor: theme.colors.surface}]}>
          <Text variant="titleMedium" style={{marginBottom: 8, color: theme.colors.onSurface}}>Year</Text>
          <View style={styles.chipGrid}>
            {years.map(y => (
              <Chip key={y} selected={selectedYear === y} onPress={() => setSelectedYear(y)} style={styles.filterChip}>
                {y.toString()}
              </Chip>
            ))}
          </View>
          <Text variant="titleMedium" style={{marginTop: 16, marginBottom: 8, color: theme.colors.onSurface}}>Month</Text>
          <View style={styles.chipGrid}>
            {monthOptions.map(option => (
              <Chip
                key={option.value}
                selected={dateFilter.mode === 'month' && dateFilter.monthYear.value === option.value}
                onPress={() => selectMonth(option)}
                style={styles.filterChip}
              >
                {option.label}
              </Chip>
            ))}
          </View>
          <Divider style={{marginVertical: 16, backgroundColor: theme.colors.custom.border}} />
          <Text variant="titleMedium" style={{marginBottom: 8, color: theme.colors.onSurface}}>Quick range</Text>
          <View style={styles.chipGrid}>
            {relativeFilterOptions.map(option => (
              <Chip
                key={option.id}
                selected={dateFilter.mode === 'relative' && dateFilter.range === option.id}
                onPress={() => selectRelativeRange(option.id)}
                style={styles.filterChip}
              >
                {option.label}
              </Chip>
            ))}
          </View>
        </Modal>
      </Portal>

      {/* GroupBy Modal */}
      <Portal>
        <Modal visible={showGroupByModal} onDismiss={() => setShowGroupByModal(false)} contentContainerStyle={[styles.modal, {backgroundColor: theme.colors.surface}]}>
          <Text variant="titleMedium" style={{marginBottom: 8, color: theme.colors.onSurface}}>Group by</Text>
          <View style={styles.chipGrid}>
            {groupByOptions.map(option => (
              <Chip key={option.id} selected={selectedGroupBy === option.id}
                onPress={() => { setSelectedGroupBy(option.id); setSelectedSortBy(option.id === 'days' ? 'date' : 'count'); setShowGroupByModal(false); }}
                style={styles.filterChip}>{option.label}</Chip>
            ))}
          </View>
          <Divider style={{marginVertical: 12}} />
          <Text variant="titleMedium" style={{marginBottom: 8, color: theme.colors.onSurface}}>Sort by</Text>
          <View style={styles.chipGrid}>
            {sortByOptions.map(option => (
              <Chip key={option.id} selected={selectedSortBy === option.id}
                onPress={() => { setSelectedSortBy(option.id === selectedSortBy ? null : option.id); setShowGroupByModal(false); }}
                style={styles.filterChip}>{option.label}</Chip>
            ))}
          </View>
        </Modal>
      </Portal>

      {isTagModal && <TagExpenses />}
      <MergeExpenses open={showMergeDialog} onClose={() => setShowMergeDialog(false)} expenses={selectedExpenses} onMergeComplete={handleMergeComplete} />
      <AddExpense open={showAddExpenseDialog} onClose={() => setShowAddExpenseDialog(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  searchWrap: {paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md},
  list: {flex: 1},
  emptyState: {alignItems: 'center', paddingTop: 80},
  groupCard: {marginHorizontal: spacing.md, marginBottom: spacing.md, overflow: 'hidden'},
  groupHeader: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md},
  groupTotal: {fontSize: 16, fontWeight: '700', marginRight: spacing.xs},
  rowGroup: {},
  expenseRow: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md},
  avatar: {width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md},
  expenseContent: {flex: 1, marginRight: spacing.sm},
  vendorName: {fontWeight: '600', marginBottom: 4},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  amount: {fontSize: 16, fontWeight: '700'},
  floatingBar: {position: 'absolute', left: 0, right: 0, bottom: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg},
  selectionBar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: 999, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, flexWrap: 'wrap'},
  chip: {marginVertical: 2},
  fabGroup: {paddingBottom: spacing.sm},
  fab: {borderRadius: 32},
  modal: {margin: 20, padding: 20, borderRadius: 16},
  chipGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  filterChip: {marginBottom: 4},
});

export default Home;
