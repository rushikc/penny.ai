import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Switch, Text} from 'react-native-paper';
import {useSelector} from 'react-redux';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import BottomSheetModal from '../../components/ui/BottomSheetModal';
import CategoryPicker from '../../components/ui/CategoryPicker';
import Tag from '../../components/ui/Tag';
import {hideTagExpense, selectExpense, setTagMap, updateExpense} from '../../store/expenseActions';
import {useAppTheme} from '../../theme/useAppTheme';
import {spacing, typography} from '../../theme/tokens';
import {formatVendorName, getDateMonthTime, JSONCopy} from '../../utility/utility';

const TagExpenses: React.FC = () => {
  const theme = useAppTheme();
  const [selectedTag, setSelectedTag] = useState('');
  const [autoTag, setAutoTag] = useState(false);
  const {vendorTagList, expense, isTagModal, tagList} = useSelector(selectExpense);

  useEffect(() => {
    if (isTagModal && expense) {
      setSelectedTag(expense.tag || '');
      setAutoTag(false);
    }
  }, [isTagModal, expense?.id, expense?.tag]);

  if (!expense || !isTagModal) return null;

  const onSaveExpense = () => {
    if (autoTag && selectedTag) {
      const _vendor = expense.vendor;
      const _tag = expense.tag;
      let tagObj = vendorTagList.find(({vendor, tag}) => vendor === _vendor && tag === _tag);
      if (!tagObj) {
        tagObj = {id: _vendor, vendor: _vendor, tag: selectedTag, date: Date.now()};
        void ExpenseAPI.updateVendorTag(tagObj);
        setTagMap(tagObj);
      }
    }
    const expenseNew = JSONCopy(expense);
    expenseNew.tag = selectedTag;
    void ExpenseAPI.addExpense(expenseNew);
    updateExpense(expenseNew);
    hideTagExpense();
  };

  const vendorNames = formatVendorName(expense.vendor);

  return (
    <BottomSheetModal
      visible={isTagModal}
      onDismiss={hideTagExpense}
      title={vendorNames[0]}
      subtitle={getDateMonthTime(expense.date)}
      secondaryLabel="Close"
      primaryLabel="Save"
      onPrimary={onSaveExpense}
      primaryDisabled={!selectedTag}
    >
      <View style={styles.summary}>
        {vendorNames[1] ? (
          <Text
            variant="bodySmall"
            numberOfLines={2}
            style={[styles.vendorSecondary, {color: theme.colors.custom.textSecondary}]}
          >
            {vendorNames[1]}
          </Text>
        ) : null}
        <Text style={[styles.amount, {color: theme.colors.primary}]}>₹{expense.cost}</Text>
        <Tag label={expense.tag || 'untagged'} />
      </View>

      <View style={[styles.autoTagRow, {backgroundColor: theme.colors.surfaceVariant}]}>
        <Text variant="bodyMedium" style={[styles.autoTagLabel, {color: theme.colors.onSurface}]}>
          Auto tag future transactions
        </Text>
        <Switch value={autoTag} onValueChange={setAutoTag} />
      </View>

      <Text style={[styles.sectionLabel, {color: theme.colors.custom.textSecondary}]}>Category</Text>
      <CategoryPicker tags={tagList} selected={selectedTag} onSelect={setSelectedTag} />
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  summary: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  vendorSecondary: {
    textAlign: 'center',
  },
  amount: {
    ...typography.amount,
    marginTop: spacing.xs,
  },
  autoTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  autoTagLabel: {
    flex: 1,
    marginRight: spacing.md,
  },
  sectionLabel: {
    ...typography.label,
    marginBottom: spacing.md,
  },
});

export default TagExpenses;
