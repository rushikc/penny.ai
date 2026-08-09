import AsyncStorage from '@react-native-async-storage/async-storage';
import {FinanceStorage} from '../../api/FinanceStorage';
import {makeBudget, makeExpense, makeVendorTag} from '../fixtures/factories';

describe('FinanceStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('upserts expenses by mailId', async () => {
    await FinanceStorage.addExpenseList([
      makeExpense({mailId: 'm1', cost: 10}),
      makeExpense({mailId: 'm2', cost: 20}),
    ]);
    await FinanceStorage.addExpenseList([makeExpense({mailId: 'm1', cost: 99})]);

    const all = await FinanceStorage.getAllData('expense');
    expect(all).toHaveLength(2);
    expect(all.find((e: {mailId: string}) => e.mailId === 'm1').cost).toBe(99);
  });

  it('reads a single expense by mailId', async () => {
    await FinanceStorage.addExpenseList([makeExpense({mailId: 'm1', vendor: 'Swiggy'})]);
    const item = await FinanceStorage.getData('expense', 'm1');
    expect(item).toMatchObject({mailId: 'm1', vendor: 'Swiggy'});
  });

  it('deletes an expense by mailId', async () => {
    await FinanceStorage.addExpenseList([
      makeExpense({mailId: 'keep'}),
      makeExpense({mailId: 'drop'}),
    ]);
    await FinanceStorage.deleteExpense('drop');
    const all = await FinanceStorage.getAllData('expense');
    expect(all.map((e: {mailId: string}) => e.mailId)).toEqual(['keep']);
  });

  it('upserts budgets by id and deletes by id', async () => {
    await FinanceStorage.addBudgetList([
      makeBudget({id: 'b1', amount: 100}),
      makeBudget({id: 'b2', amount: 200}),
    ]);
    await FinanceStorage.addBudgetList([makeBudget({id: 'b1', amount: 150})]);
    await FinanceStorage.deleteBudget('b2');

    const all = await FinanceStorage.getAllData('budget');
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({id: 'b1', amount: 150});
  });

  it('merges config values by key', async () => {
    await FinanceStorage.addConfig([{key: 'a', value: 1}]);
    await FinanceStorage.addConfig([
      {key: 'a', value: 2},
      {key: 'b', value: 3},
    ]);
    expect(await FinanceStorage.getData('config', 'a')).toEqual({key: 'a', value: 2});
    expect(await FinanceStorage.getAllData('config')).toHaveLength(2);
  });

  it('looks up vendor tags by vendor', async () => {
    await FinanceStorage.addVendorTag(makeVendorTag({vendor: 'swiggy', tag: 'Food'}));
    expect(await FinanceStorage.getData('vendorTag', 'swiggy')).toMatchObject({tag: 'Food'});
  });

  it('returns empty arrays for missing stores', async () => {
    expect(await FinanceStorage.getAllData('expense')).toEqual([]);
    expect(await FinanceStorage.getData('expense', 'missing')).toBeUndefined();
  });

  it('clears all storage data', async () => {
    await FinanceStorage.addExpenseList([makeExpense()]);
    await FinanceStorage.addBudgetList([makeBudget()]);
    await FinanceStorage.clearStorageData();
    expect(await FinanceStorage.getAllData('expense')).toEqual([]);
    expect(await FinanceStorage.getAllData('budget')).toEqual([]);
  });
});
