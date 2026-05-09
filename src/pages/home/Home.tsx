import React, {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet, FlatList, Pressable, ScrollView} from 'react-native';
import {Searchbar, Chip, FAB, Text, useTheme, IconButton, Portal, Modal, Divider} from 'react-native-paper';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useSelector} from 'react-redux';
import {Expense} from '../../Types';
import Loading from '../../components/Loading';
import {deleteExpense, mergeSaveExpense, selectExpense, setExpenseList, setTagExpense} from '../../store/expenseActions';
import {formatVendorName, getDateMonth, sortByKey} from '../../utility/utility';
import {DateRange, filterExpensesByDate, filterOptions, GroupByOption, groupByOptions, GroupedExpenses, groupExpenses, searchExpenses, SortByOption, sortByOptions} from '../dataValidations';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import TagExpenses from './TagExpenses';
import AddExpense from './AddExpense';
import MergeExpenses from './MergeExpenses';
import {SafeAreaView} from 'react-native-safe-area-context';

const Home: React.FC = () => {
  const theme = useTheme();
  const {expenseList, isAppLoading, isTagModal} = useSelector(selectExpense);
  const [selectedRange, setSelectedRange] = useState<DateRange>('7d');
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

  useEffect(() => { setLoading(isAppLoading); }, [isAppLoading]);

  useEffect(() => {
    if (expenseList.length === 0) { setDateFilteredExpenses([]); return; }
    const filtered = filterExpensesByDate(expenseList, selectedRange);
    setDateFilteredExpenses(sortByKey(filtered, 'date'));
  }, [expenseList, selectedRange]);

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

  const sortedGroupKeys = Object.entries(groupedExpenses)
    .sort(([keyA, a], [keyB, b]) => {
      if (selectedGroupBy === 'days' && (selectedSortBy === 'date' || selectedSortBy == null))
        return keyB.localeCompare(keyA);
      return selectedSortBy === 'cost' ? b.totalAmount - a.totalAmount : b.expenses.length - a.expenses.length;
    })
    .map(([key]) => key);

  const renderExpenseItem = (expense: Expense) => {
    const isSelected = selectedExpenses.some(e => e.id === expense.id);
    const vendorNames = formatVendorName(expense.vendor);
    return (
      <Pressable
        key={expense.mailId}
        onPress={() => selectionMode ? toggleExpenseSelection(expense) : setTagExpense(expense)}
        onLongPress={() => toggleExpenseSelection(expense)}
        delayLongPress={500}
        style={[styles.expenseRow, isSelected && {backgroundColor: theme.colors.primaryContainer}]}
      >
        <View style={[styles.avatar, {backgroundColor: isSelected ? theme.colors.primary : theme.colors.secondaryContainer}]}>
          <MaterialCommunityIcons
            name={isSelected ? 'check' : expense.type === 'credit-card' ? 'credit-card' : 'currency-inr'}
            size={20}
            color={isSelected ? 'white' : theme.colors.onSecondaryContainer}
          />
        </View>
        <View style={styles.expenseContent}>
          <View style={styles.expenseHeader}>
            <Text variant="bodyMedium" numberOfLines={1} style={[styles.vendorName, {color: theme.colors.onSurface}]}>
              {vendorNames[0]}
            </Text>
            <Text variant="bodyMedium" style={{color: theme.colors.onSurface}}>
              {expense.costType === 'debit' ? '' : '+'}₹{expense.cost}
            </Text>
          </View>
          <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant}}>{getDateMonth(expense.date)}</Text>
          <Text variant="labelSmall" style={{color: expense.tag ? theme.colors.primary : theme.colors.outline}}>
            {expense.tag || 'untagged'}
          </Text>
        </View>
      </Pressable>
    );
  };

  if (isLoading) return <Loading />;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]} edges={['top']}>
      <Searchbar
        placeholder="Search expenses..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        style={[styles.searchbar, {backgroundColor: theme.colors.surfaceVariant}]}
      />

      <ScrollView style={styles.list} contentContainerStyle={{paddingBottom: 100}}>
        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="cash-remove" size={48} color={theme.colors.outline} />
            <Text variant="bodyLarge" style={{color: theme.colors.outline, marginTop: 12}}>
              {searchTerm ? 'No matching expenses' : 'No expenses found'}
            </Text>
          </View>
        ) : (
          sortedGroupKeys.map(groupKey => {
            const groupData = groupedExpenses[groupKey];
            const isCollapsed = collapsedGroups[groupKey];
            return (
              <View key={groupKey} style={[styles.groupBox, {backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant}]}>
                <Pressable style={styles.groupHeader} onPress={() => toggleGroupCollapse(groupKey)}>
                  <View style={{flex: 1}}>
                    <Text variant="titleSmall" style={{color: theme.colors.onSurface}}>
                      {selectedGroupBy === 'days' ? groupData.groupLabel : groupData.groupLabel.toLowerCase()}
                    </Text>
                    <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant}}>
                      {groupData.expenses.length} expense{groupData.expenses.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text variant="titleSmall" style={{color: theme.colors.primary, marginRight: 4}}>
                    ₹{Math.abs(groupData.totalAmount).toFixed(0)}
                  </Text>
                  <MaterialCommunityIcons
                    name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                </Pressable>
                {!isCollapsed && groupData.expenses.map(renderExpenseItem)}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Bottom action bar */}
      <View style={[styles.bottomBar, {backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant}]}>
        {!selectionMode ? (
          <>
            <Chip icon="filter-variant" onPress={() => setShowFilterModal(true)} style={styles.chip} compact>
              {filterOptions.find(o => o.id === selectedRange)?.label}
            </Chip>
            <Chip icon="sort" onPress={() => setShowGroupByModal(true)} style={styles.chip} compact>
              {groupByOptions.find(o => o.id === selectedGroupBy)?.label}
            </Chip>
          </>
        ) : (
          <>
            <Chip icon="close" onPress={cancelSelection} style={styles.chip} compact>{selectedExpenses.length} selected</Chip>
            <Chip icon="delete" onPress={handleDeleteSelected} style={[styles.chip, {backgroundColor: theme.colors.errorContainer}]} compact>Delete</Chip>
            {selectedExpenses.length >= 2 && (
              <Chip icon="merge" onPress={() => setShowMergeDialog(true)} style={styles.chip} compact>Merge</Chip>
            )}
          </>
        )}
      </View>

      {!selectionMode && (
        <FAB icon="plus" style={[styles.fab, {backgroundColor: theme.colors.primary}]} color="white" onPress={() => setShowAddExpenseDialog(true)} />
      )}

      {/* Filter Modal */}
      <Portal>
        <Modal visible={showFilterModal} onDismiss={() => setShowFilterModal(false)} contentContainerStyle={[styles.modal, {backgroundColor: theme.colors.surface}]}>
          <Text variant="titleMedium" style={{marginBottom: 12, color: theme.colors.onSurface}}>Filter by date range</Text>
          <View style={styles.chipGrid}>
            {filterOptions.map(option => (
              <Chip key={option.id} selected={selectedRange === option.id} onPress={() => { setSelectedRange(option.id); setShowFilterModal(false); }}
                style={styles.filterChip}>{option.label}</Chip>
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
  searchbar: {margin: 12, elevation: 1},
  list: {flex: 1},
  emptyState: {alignItems: 'center', paddingTop: 80},
  groupBox: {marginHorizontal: 12, marginBottom: 8, borderRadius: 12, borderWidth: 1, overflow: 'hidden'},
  groupHeader: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12},
  expenseRow: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: '#eee'},
  avatar: {width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12},
  expenseContent: {flex: 1},
  expenseHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  vendorName: {flex: 1, marginRight: 8},
  bottomBar: {flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, gap: 8, flexWrap: 'wrap'},
  chip: {marginVertical: 2},
  fab: {position: 'absolute', right: 20, bottom: 76, borderRadius: 28},
  modal: {margin: 20, padding: 20, borderRadius: 16},
  chipGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  filterChip: {marginBottom: 4},
});

export default Home;
