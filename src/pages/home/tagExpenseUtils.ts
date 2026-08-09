import {Expense, VendorTag} from '../../Types';
import {JSONCopy} from '../../utility/utility';

export const canSaveTaggedExpense = (selectedTag: string): boolean =>
  selectedTag.trim().length > 0;

export const resolveAutoTagMapping = (
  expense: Expense,
  selectedTag: string,
  vendorTagList: VendorTag[],
  nowMs: number = Date.now(),
): {shouldCreateMapping: boolean; tagObj: VendorTag | null} => {
  if (!selectedTag) {
    return {shouldCreateMapping: false, tagObj: null};
  }

  const existing = vendorTagList.find(
    ({vendor, tag}) => vendor === expense.vendor && tag === expense.tag,
  );
  if (existing) {
    return {shouldCreateMapping: false, tagObj: existing};
  }

  return {
    shouldCreateMapping: true,
    tagObj: {
      id: expense.vendor,
      vendor: expense.vendor,
      tag: selectedTag,
      date: nowMs,
    },
  };
};

export const buildTaggedExpense = (expense: Expense, selectedTag: string): Expense => {
  const expenseNew = JSONCopy(expense) as Expense;
  expenseNew.tag = selectedTag;
  return expenseNew;
};
