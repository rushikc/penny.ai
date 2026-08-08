import React, {useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {Chip, Text} from 'react-native-paper';
import {useSelector} from 'react-redux';
import {Expense} from '../../Types';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import BottomSheetModal from '../../components/ui/BottomSheetModal';
import {selectExpense} from '../../store/expenseActions';
import {formatVendorName} from '../../utility/utility';
import {createTimedAlert} from '../../store/alertActions';
import {useAppTheme} from '../../theme/useAppTheme';

interface MergeExpensesProps {
  expenses: Expense[];
  open: boolean;
  onClose: () => void;
  onMergeComplete?: (mergedExpense: Expense) => void;
}

const MergeExpenses: React.FC<MergeExpensesProps> = ({expenses, open, onClose, onMergeComplete}) => {
  const theme = useAppTheme();
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  const {tagList} = useSelector(selectExpense);

  useEffect(() => {
    if (open && expenses.length > 0) {
      const total = expenses.reduce((sum, exp) => sum + (exp.costType === 'debit' ? -exp.cost : exp.cost), 0);
      setTotalCost(total);
      setSelectedVendor('');
      setSelectedTag('');
    }
  }, [expenses, open]);

  const onSaveMergedExpense = async () => {
    if (!selectedVendor) {
      createTimedAlert({type: 'error', message: 'Please select a vendor first'});
      return;
    }
    const vendorExpense = expenses.find(exp => exp.vendor === selectedVendor) || expenses[0];
    const mergedExpense: Expense = {
      id: vendorExpense.id, vendor: selectedVendor, tag: selectedTag || vendorExpense.tag,
      cost: Math.abs(totalCost), date: vendorExpense.date, modifiedDate: Date.now(),
      costType: totalCost < 0 ? 'debit' : 'credit', mailId: vendorExpense.mailId,
      user: vendorExpense.user, type: vendorExpense.type, operation: 'merged',
    };

    const promiseList = expenses.map(exp => ExpenseAPI.addExpense(exp, 'delete'));
    await Promise.all(promiseList);
    await ExpenseAPI.addExpense(mergedExpense);
    if (onMergeComplete) onMergeComplete(mergedExpense);
    else onClose();
  };

  const uniqueVendors = Array.from(new Set(expenses.map(exp => exp.vendor)));

  return (
    <BottomSheetModal
      visible={open}
      onDismiss={onClose}
      title={`Merge ${expenses.length} Expenses`}
      primaryLabel="Merge"
      onPrimary={onSaveMergedExpense}
    >
      <Text variant="headlineSmall" style={{color: totalCost < 0 ? theme.colors.error : theme.colors.primary, textAlign: 'center'}}>
        {totalCost < 0 ? '- ' : '+ '}₹{Math.abs(totalCost).toFixed(2)}
      </Text>
      <Text variant="titleSmall" style={{marginTop: 16, marginBottom: 8}}>Select vendor</Text>
      <View style={styles.chipGrid}>
        {uniqueVendors.map((vendor, i) => (
          <Chip key={i} selected={selectedVendor === vendor} onPress={() => setSelectedVendor(vendor)}>
            {formatVendorName(vendor)[0]}
          </Chip>
        ))}
      </View>
      <Text variant="titleSmall" style={{marginTop: 16, marginBottom: 8}}>Select a category</Text>
      <View style={styles.chipGrid}>
        {tagList.map((tag, i) => (
          <Chip key={i} selected={selectedTag === tag} onPress={() => setSelectedTag(tag)}>{tag}</Chip>
        ))}
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  chipGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
});

export default MergeExpenses;
