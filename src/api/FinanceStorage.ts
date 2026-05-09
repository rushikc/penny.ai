/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import AsyncStorage from '@react-native-async-storage/async-storage';
import {Config, Expense, VendorTag, Budget} from '../Types';

const STORE_KEYS = {
  expense: '@finance_expenses',
  vendorTag: '@finance_vendorTags',
  config: '@finance_config',
  budget: '@finance_budgets',
};

type TableNames = 'expense' | 'vendorTag' | 'config' | 'budget';

export class FinanceStorage {

  static initDB = (): void => {
    // AsyncStorage doesn't require initialization like IndexedDB
  };

  private static getStoreData = async <T>(storeName: TableNames): Promise<T[]> => {
    try {
      const data = await AsyncStorage.getItem(STORE_KEYS[storeName]);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading ${storeName}:`, error);
      return [];
    }
  };

  private static setStoreData = async <T>(storeName: TableNames, data: T[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORE_KEYS[storeName], JSON.stringify(data));
    } catch (error) {
      console.error(`Error writing ${storeName}:`, error);
    }
  };

  static addExpenseList = async (expenseList: Expense[]): Promise<void> => {
    const existing = await FinanceStorage.getStoreData<Expense>('expense');
    const expenseMap = new Map(existing.map(e => [e.mailId, e]));
    expenseList.forEach(expense => {
      expenseMap.set(expense.mailId, expense);
    });
    await FinanceStorage.setStoreData('expense', Array.from(expenseMap.values()));
  };

  static addVendorTag = async (vendorTag: VendorTag): Promise<void> => {
    const existing = await FinanceStorage.getStoreData<VendorTag>('vendorTag');
    const index = existing.findIndex(t => t.vendor === vendorTag.vendor);
    if (index > -1) {
      existing[index] = vendorTag;
    } else {
      existing.push(vendorTag);
    }
    await FinanceStorage.setStoreData('vendorTag', existing);
  };

  static addConfig = async (configList: Config[]): Promise<void> => {
    const existing = await FinanceStorage.getStoreData<Config>('config');
    const configMap = new Map(existing.map(c => [c.key, c]));
    configList.forEach(config => {
      configMap.set(config.key, config);
    });
    await FinanceStorage.setStoreData('config', Array.from(configMap.values()));
  };

  static getData = async <T extends TableNames>(
    storeName: T,
    keyPath: string
  ): Promise<Config | Expense | VendorTag | Budget | undefined> => {
    const data = await FinanceStorage.getStoreData<any>(storeName);
    const keyField = storeName === 'expense' ? 'mailId' :
                     storeName === 'config' ? 'key' :
                     storeName === 'vendorTag' ? 'vendor' : 'id';
    return data.find((item: any) => item[keyField] === keyPath);
  };

  static getAllData = async <T extends TableNames>(storeName: T): Promise<any[]> => {
    return FinanceStorage.getStoreData(storeName);
  };

  static clearStorageData = async (): Promise<void> => {
    try {
      const keys = Object.values(STORE_KEYS);
      await AsyncStorage.multiRemove(keys);
      console.log('AsyncStorage data cleared successfully');
    } catch (error) {
      console.error('Error clearing AsyncStorage data:', error);
    }
  };

  static deleteExpense = async (mailId: string): Promise<void> => {
    const existing = await FinanceStorage.getStoreData<Expense>('expense');
    const filtered = existing.filter(e => e.mailId !== mailId);
    await FinanceStorage.setStoreData('expense', filtered);
  };

  static addBudgetList = async (budgetList: Budget[]): Promise<void> => {
    const existing = await FinanceStorage.getStoreData<Budget>('budget');
    const budgetMap = new Map(existing.map(b => [b.id, b]));
    budgetList.forEach(budget => {
      budgetMap.set(budget.id, budget);
    });
    await FinanceStorage.setStoreData('budget', Array.from(budgetMap.values()));
  };

  static deleteBudget = async (budgetId: string): Promise<void> => {
    const existing = await FinanceStorage.getStoreData<Budget>('budget');
    const filtered = existing.filter(b => b.id !== budgetId);
    await FinanceStorage.setStoreData('budget', filtered);
  };
}
