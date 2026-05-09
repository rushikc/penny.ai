import React, {useEffect, useState} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Button, Chip, Dialog, Portal, Text, TextInput, useTheme} from 'react-native-paper';
import {useSelector} from 'react-redux';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import {addBudget, deleteBudget, selectExpense, updateBudget} from '../../store/expenseActions';
import {Budget} from '../../Types';
import {createTimedAlert} from '../../store/alertActions';

interface EditBudgetProps {
  open: boolean;
  budget: Budget | null;
  onClose: () => void;
  onBudgetUpdated?: (budget: Budget) => void;
  onBudgetDeleted?: (budgetId: string) => void;
}

const EditBudget: React.FC<EditBudgetProps> = ({open, budget, onClose, onBudgetUpdated, onBudgetDeleted}) => {
  const [budgetName, setBudgetName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const {tagList} = useSelector(selectExpense);
  const isAddMode = budget === null;

  useEffect(() => {
    if (open && budget) {
      setBudgetName(budget.name);
      setAmount(budget.amount.toString());
      setSelectedTags([...budget.tagList]);
    }
  }, [open, budget]);

  useEffect(() => {
    if (!open) { setBudgetName(''); setAmount(''); setSelectedTags([]); }
  }, [open]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const onSaveBudget = async () => {
    const budgetData = {name: budgetName.trim(), amount: parseFloat(amount), tagList: selectedTags, modifiedDate: Date.now()};
    try {
      if (isAddMode) {
        const result = await ExpenseAPI.addBudget({...budgetData, id: '', operation: 'create'});
        addBudget(result);
        createTimedAlert({type: 'success', message: 'Budget created successfully!'});
      } else {
        const result = await ExpenseAPI.updateBudget({...budget, ...budgetData, operation: 'update'});
        updateBudget(result);
        createTimedAlert({type: 'success', message: 'Budget updated successfully!'});
      }
      if (onBudgetUpdated && budget) onBudgetUpdated(budget);
      onClose();
    } catch (error) {
      createTimedAlert({type: 'error', message: `Failed to ${isAddMode ? 'create' : 'update'} budget.`});
    }
  };

  const onDeleteBudget = async () => {
    if (!budget) return;
    try {
      const success = await ExpenseAPI.deleteBudget(budget);
      if (success) {
        deleteBudget(budget.id);
        if (onBudgetDeleted) onBudgetDeleted(budget.id);
        createTimedAlert({type: 'success', message: 'Budget deleted successfully!'});
        onClose();
      }
    } catch (error) {
      createTimedAlert({type: 'error', message: 'Failed to delete budget.'});
    }
  };

  const isFormValid = () => budgetName.trim() !== '' && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && selectedTags.length > 0;

  return (
    <Portal>
      <Dialog visible={open} onDismiss={onClose}>
        <Dialog.Title>{isAddMode ? 'Add Budget' : 'Edit Budget'}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView>
            <View style={styles.content}>
              <TextInput label="Budget Name" value={budgetName} onChangeText={setBudgetName} mode="outlined" style={styles.input} />
              <TextInput label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" mode="outlined"
                left={<TextInput.Affix text="₹" />} style={styles.input} />
              <Text variant="titleSmall" style={styles.label}>Select tags</Text>
              <View style={styles.chipGrid}>
                {tagList.map(tag => (
                  <Chip key={tag} selected={selectedTags.includes(tag)} onPress={() => handleTagToggle(tag)}>{tag}</Chip>
                ))}
              </View>
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          {!isAddMode && <Button textColor="red" onPress={onDeleteBudget}>Delete</Button>}
          <Button onPress={onClose}>Cancel</Button>
          <Button mode="contained" disabled={!isFormValid()} onPress={onSaveBudget}>
            {isAddMode ? 'Create' : 'Save'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  content: {paddingHorizontal: 16, paddingVertical: 8},
  input: {marginBottom: 12},
  label: {marginTop: 8, marginBottom: 8},
  chipGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 16},
});

export default EditBudget;
