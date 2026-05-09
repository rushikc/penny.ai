import React, {useState} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Button, Chip, Dialog, Portal, Switch, Text, useTheme} from 'react-native-paper';
import {useSelector} from 'react-redux';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import {hideTagExpense, selectExpense, setTagMap, updateExpense} from '../../store/expenseActions';
import {formatVendorName, getDateMonthTime, JSONCopy} from '../../utility/utility';

const TagExpenses: React.FC = () => {
  const theme = useTheme();
  const [selectedTag, setSelectedTag] = useState<string[]>([]);
  const [autoTag, setAutoTag] = useState(false);
  const {vendorTagList, expense, isTagModal, tagList} = useSelector(selectExpense);

  if (!expense || !isTagModal) return null;

  const onSaveExpense = () => {
    if (autoTag && selectedTag.length > 0) {
      const _vendor = expense.vendor;
      const _tag = expense.tag;
      let tagObj = vendorTagList.find(({vendor, tag}) => vendor === _vendor && tag === _tag);
      if (!tagObj) {
        tagObj = {id: _vendor, vendor: _vendor, tag: selectedTag[0], date: Date.now()};
        void ExpenseAPI.updateVendorTag(tagObj);
        setTagMap(tagObj);
      }
    }
    const expenseNew = JSONCopy(expense);
    expenseNew.tag = selectedTag[0];
    void ExpenseAPI.addExpense(expenseNew);
    updateExpense(expenseNew);
    hideTagExpense();
  };

  const vendorNames = formatVendorName(expense.vendor);

  return (
    <Portal>
      <Dialog visible={isTagModal} onDismiss={hideTagExpense} style={{maxHeight: '80%'}}>
        <Dialog.ScrollArea>
          <ScrollView>
            <View style={styles.summary}>
              <Text variant="titleMedium" style={{color: theme.colors.onSurface}}>{vendorNames[0]}</Text>
              {vendorNames[1] && <Text variant="bodySmall" style={{color: theme.colors.outline}}>{vendorNames[1]}</Text>}
              <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, marginTop: 4}}>{getDateMonthTime(expense.date)}</Text>
              <Text variant="headlineSmall" style={{color: theme.colors.primary, marginTop: 4}}>₹{expense.cost}</Text>
              <Text variant="labelSmall" style={{color: expense.tag ? theme.colors.primary : theme.colors.outline}}>
                {expense.tag || 'untagged'}
              </Text>
            </View>

            <View style={styles.autoTagRow}>
              <Text variant="bodyMedium" style={{flex: 1}}>Auto tag future transactions</Text>
              <Switch value={autoTag} onValueChange={setAutoTag} />
            </View>

            <Text variant="titleSmall" style={[styles.label, {color: theme.colors.onSurface}]}>Select a category</Text>
            <View style={styles.chipGrid}>
              {tagList.map((tag, i) => (
                <Chip key={i} selected={selectedTag.includes(tag)} onPress={() => setSelectedTag([tag])}
                  style={styles.chip}>{tag}</Chip>
              ))}
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={hideTagExpense}>Close</Button>
          <Button mode="contained" disabled={selectedTag.length === 0} onPress={onSaveExpense}>Save</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  summary: {alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16},
  autoTagRow: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8},
  label: {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8},
  chipGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 16},
  chip: {marginBottom: 4},
});

export default TagExpenses;
