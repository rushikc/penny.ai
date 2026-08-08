import React, {useEffect, useState} from 'react';
import {StyleSheet, TextInput, View} from 'react-native';
import {Text} from 'react-native-paper';
import {useSelector} from 'react-redux';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import BottomSheetModal from '../../components/ui/BottomSheetModal';
import CategoryPicker from '../../components/ui/CategoryPicker';
import {selectExpense, updateExpense} from '../../store/expenseActions';
import {useAppTheme} from '../../theme/useAppTheme';
import {radius, spacing, typography} from '../../theme/tokens';
import {generateUUID, getDateMonthTime} from '../../utility/utility';

interface AddExpenseProps {
  open: boolean;
  onClose: () => void;
}

const AddExpense: React.FC<AddExpenseProps> = ({open, onClose}) => {
  const theme = useAppTheme();
  const [selectedTag, setSelectedTag] = useState('');
  const [cost, setCost] = useState('');
  const {tagList} = useSelector(selectExpense);

  useEffect(() => {
    if (open) {
      setSelectedTag('');
      setCost('');
    }
  }, [open]);

  const parsedCost = parseFloat(cost);
  const canSave = !!cost && !isNaN(parsedCost) && parsedCost > 0;

  const onSaveExpense = () => {
    const uuid = generateUUID();
    const newExpense = {
      id: 'manual',
      vendor: uuid.substring(0, 4) + ' manual entry',
      date: Date.now(),
      modifiedDate: Date.now(),
      cost: parsedCost,
      tag: selectedTag,
      costType: 'debit' as const,
      mailId: uuid,
      user: 'manual',
      type: 'manual',
      operation: 'update',
    };

    ExpenseAPI.addExpense(newExpense).then((expense) => {
      updateExpense(expense);
      onClose();
    });
  };

  return (
    <BottomSheetModal
      visible={open}
      onDismiss={onClose}
      title="Add New Expense"
      subtitle={getDateMonthTime(Date.now())}
      secondaryLabel="Cancel"
      primaryLabel="Save"
      onPrimary={onSaveExpense}
      primaryDisabled={!canSave}
    >
      <View style={[styles.amountField, {backgroundColor: theme.colors.surfaceVariant}]}>
        <Text style={[styles.currency, {color: theme.colors.custom.textSecondary}]}>₹</Text>
        <TextInput
          style={[styles.amountInput, {color: theme.colors.onSurface}]}
          value={cost}
          onChangeText={setCost}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={theme.colors.custom.textSecondary}
          returnKeyType="done"
        />
      </View>

      <Text style={[styles.sectionLabel, {color: theme.colors.custom.textSecondary}]}>Category</Text>
      <CategoryPicker tags={tagList} selected={selectedTag} onSelect={setSelectedTag} />
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 52,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  currency: {
    fontSize: 20,
    fontWeight: '600',
  },
  amountInput: {
    flex: 1,
    ...typography.amountHero,
    padding: 0,
  },
  sectionLabel: {
    ...typography.label,
    marginBottom: spacing.md,
  },
});

export default AddExpense;
