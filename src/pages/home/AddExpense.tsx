import React, {useEffect, useState} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Button, Chip, Dialog, Portal, Text, TextInput, useTheme} from 'react-native-paper';
import {useSelector} from 'react-redux';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import {selectExpense, updateExpense} from '../../store/expenseActions';
import {generateUUID, getDateMonthTime} from '../../utility/utility';

interface AddExpenseProps {
  open: boolean;
  onClose: () => void;
}

const AddExpense: React.FC<AddExpenseProps> = ({open, onClose}) => {
  const theme = useTheme();
  const [selectedTag, setSelectedTag] = useState('');
  const [cost, setCost] = useState('');
  const {tagList} = useSelector(selectExpense);

  useEffect(() => {
    if (open) { setSelectedTag(''); setCost(''); }
  }, [open]);

  const onSaveExpense = () => {
    const uuid = generateUUID();
    const newExpense = {
      id: 'manual',
      vendor: uuid.substring(0, 4) + ' manual entry',
      date: Date.now(),
      modifiedDate: Date.now(),
      cost: parseFloat(cost),
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
    <Portal>
      <Dialog visible={open} onDismiss={onClose}>
        <Dialog.Title>Add New Expense</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView>
            <View style={styles.content}>
              <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, marginBottom: 12}}>
                {getDateMonthTime(Date.now())}
              </Text>
              <TextInput
                label="Cost (₹)"
                value={cost}
                onChangeText={setCost}
                keyboardType="numeric"
                mode="outlined"
                left={<TextInput.Affix text="₹" />}
                style={{marginBottom: 16}}
              />
              <Text variant="titleSmall" style={{marginBottom: 8}}>Select a category</Text>
              <View style={styles.chipGrid}>
                {tagList.map((tag, i) => (
                  <Chip key={i} selected={selectedTag === tag} onPress={() => setSelectedTag(tag)}
                    style={styles.chip}>{tag}</Chip>
                ))}
              </View>
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onClose}>Cancel</Button>
          <Button mode="contained" disabled={!cost || isNaN(parseFloat(cost)) || parseFloat(cost) <= 0} onPress={onSaveExpense}>Save</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  content: {paddingHorizontal: 16, paddingVertical: 8},
  chipGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {marginBottom: 4},
});

export default AddExpense;
