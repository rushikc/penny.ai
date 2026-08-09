import {collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where} from 'firebase/firestore/lite';
import {BUDGET_LAST_UPDATE, EXPENSE_LAST_UPDATE, TAG_LAST_UPDATE} from '../utility/constants';
import {db} from '../firebase/firebaseConfig';
import {getDateJsIdFormat, getUnixTimestamp, JSONCopy, sleep} from '../utility/utility';
import {FinanceStorage} from './FinanceStorage';
import {BankConfig, Budget, Expense, InvestmentConfig, VendorTag} from '../Types';
import {DEFAULT_INVESTMENT_CONFIG, DEFAULT_INVESTMENT_ASSETS} from '../utility/investmentCalculations';

// eslint-disable-next-line
export type DocumentData = { [field: string]: unknown };

const fireStoreDoc = {
  // eslint-disable-next-line
  set: async (collectionName: string, key: string, val: unknown) => {
    try {
      await setDoc(doc(db, collectionName, key), val);
    } catch (e) {
      console.error('Error adding document:', e);
    }
  },
  get: async (collectionName: string, key: string) => {
    try {
      const snap = await getDoc(doc(db, collectionName, key));
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      console.error('Error getting document:', e);
      return null;
    }
  },
  delete: async (collectionName: string, key: string) => {
    try {
      await deleteDoc(doc(db, collectionName, key));
      return true;
    } catch (e) {
      console.error('Error deleting document:', e);
      return false;
    }
  }
};

export class ExpenseAPI {

  static setOneDoc = async (
    key: string,
    val: unknown,
    collectionName = 'config') =>
    fireStoreDoc.set(collectionName, key, val);

  static getOneDoc = async (key: string, collectionName = 'config') =>
    fireStoreDoc.get(collectionName, key);

  static deleteOneDoc = async (key: string, collectionName = 'config') =>
    fireStoreDoc.delete(collectionName, key);

  static processData = async () => {};

  static addExpense = async (_expense: Expense, operation = 'update'): Promise<Expense> => {
    try {
      const expense = JSONCopy(_expense);
      const key = getDateJsIdFormat(new Date(expense.date)) + ' ' + expense.vendor.slice(0, 10);

      expense.modifiedDate = Date.now();
      expense.cost = Number(expense.cost.toFixed(2));
      expense.operation = operation;

      const docRef = doc(db, 'expense', key);
      const {id, ...expenseWithoutId} = expense;
      await setDoc(docRef, expenseWithoutId);

      expense.id = key;
      await FinanceStorage.addExpenseList([expense]);

      return expense;
    } catch (e) {
      console.error('Error adding document: ', e, _expense);
      return _expense;
    }
  };

  static deleteExpense = async (expense: Expense): Promise<boolean> => {
    try {
      const docRef = doc(db, 'expense', expense.id);
      await deleteDoc(docRef);

      if (expense.mailId) {
        await FinanceStorage.deleteExpense(expense.mailId);
      }

      return true;
    } catch (e) {
      console.error('Error deleting expense:', e);
      return false;
    }
  };

  static getExpenseList = async (overrideLastDate: number | undefined = undefined): Promise<Expense[]> => {
    try {
      const table = 'expense';
      let indexDocList: Expense[];
      const fireDocList: Expense[] = [];
      let lastUpdatedDate = getUnixTimestamp('2020-01-01');

      const configData = await FinanceStorage.getData('config', EXPENSE_LAST_UPDATE);
      if (configData && 'value' in configData) lastUpdatedDate = Number(configData.value);
      if (overrideLastDate) lastUpdatedDate = overrideLastDate;

      const q = query(collection(db, table), where('modifiedDate', '>=', lastUpdatedDate));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.docs.length) {
        fireDocList.push(...querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Expense)));
        await FinanceStorage.addExpenseList(fireDocList);
      }

      await FinanceStorage.addConfig([{key: EXPENSE_LAST_UPDATE, value: Date.now() - 3600000}]);
      indexDocList = await FinanceStorage.getAllData('expense');
      indexDocList = indexDocList.filter((item: Expense) => item.operation !== 'delete');
      return indexDocList;
    } catch (e) {
      console.error('Error fetching expense list: ', e);
      return [];
    }
  };

  static getTagList = async () => {
    try {
      const tagObject = await ExpenseAPI.getOneDoc('tags', 'config');
      const tagList: string[] = tagObject?.tagList || [];
      return tagList;
    } catch (e) {
      console.error('Error getting tag list: ', e);
      return [];
    }
  };

  static updateTagList = async (tags: string[]) => {
    try {
      await ExpenseAPI.setOneDoc('tags', {tagList: tags}, 'config');
    } catch (e) {
      console.error('Error updating tag list: ', e);
    }
  };

  static getBankConfig = async (): Promise<BankConfig> => {
    try {
      const bankConfig = await ExpenseAPI.getOneDoc('bankConfig', 'config');
      if (!bankConfig) {
        return { enableUpi: false, creditCards: [] };
      }
      return {
        enableUpi: bankConfig.enableUpi ?? false,
        creditCards: bankConfig.creditCards ?? []
      };
    } catch (e) {
      console.error('Error getting bank config:', e);
      return { enableUpi: false, creditCards: [] };
    }
  };

  static updateBankConfig = async (config: BankConfig) => {
    try {
      await ExpenseAPI.setOneDoc('bankConfig', config, 'config');
      return true;
    } catch (e) {
      console.error('Error updating bank config:', e);
      return false;
    }
  };

  static getDarkModeConfig = async (): Promise<boolean> => {
    try {
      const darkModeConfig = await ExpenseAPI.getOneDoc('darkMode', 'config');
      if (!darkModeConfig) return false;
      return darkModeConfig.value;
    } catch (e) {
      console.error('Error getting dark mode config:', e);
      return false;
    }
  };

  static updateDarkMode = async (val: boolean) => {
    try {
      await ExpenseAPI.setOneDoc('darkMode', { value: val }, 'config');
      return true;
    } catch (e) {
      console.error('Error updating dark mode:', e);
      return false;
    }
  };

  static getInvestmentConfig = async (): Promise<InvestmentConfig> => {
    try {
      const cfg = await ExpenseAPI.getOneDoc('investments', 'config');
      if (!cfg) {
        return DEFAULT_INVESTMENT_CONFIG;
      }

      return {
        assets: cfg.assets?.length ? cfg.assets : DEFAULT_INVESTMENT_ASSETS,
        includeSip: cfg.includeSip ?? true,
        years: cfg.years ?? DEFAULT_INVESTMENT_CONFIG.years,
        assumedReturnRate: cfg.assumedReturnRate ?? DEFAULT_INVESTMENT_CONFIG.assumedReturnRate,
      };
    } catch (e) {
      console.error('Error getting investment config:', e);
      return DEFAULT_INVESTMENT_CONFIG;
    }
  };

  static updateInvestmentConfig = async (config: InvestmentConfig) => {
    try {
      await ExpenseAPI.setOneDoc('investments', config, 'config');
      return true;
    } catch (e) {
      console.error('Error updating investment config:', e);
      return false;
    }
  };

  static getVendorTagList = async (): Promise<VendorTag[]> => {
    try {
      const table = 'vendorTag';
      const fireDocList: VendorTag[] = [];
      let lastUpdatedDate = getUnixTimestamp('2020-01-01');

      const configData = await FinanceStorage.getData('config', TAG_LAST_UPDATE);
      if (configData && 'value' in configData) {
        lastUpdatedDate = Number(configData.value);
      }

      const q = query(collection(db, table), where('date', '>', lastUpdatedDate));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.docs.length) {
        fireDocList.push(...querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as VendorTag)));
        fireDocList.forEach(val => FinanceStorage.addVendorTag(val));
      }

      await FinanceStorage.addConfig([{key: TAG_LAST_UPDATE, value: Date.now() - 3600000}]);
      return await FinanceStorage.getAllData('vendorTag');
    } catch (e) {
      console.error('Error getting vendor tag list: ', e);
      return [];
    }
  };

  static updateVendorTag = async (vendorTag: VendorTag) => {
    try {
      const {id, ...vendorTagWithoutId} = vendorTag;
      vendorTagWithoutId.date = Date.now();
      const docRef = doc(db, 'vendorTag', id);
      await setDoc(docRef, vendorTagWithoutId);
      return true;
    } catch (e) {
      console.error('Error updating vendorTag:', e);
      return false;
    }
  };

  static deleteVendorTag = async (vendorTagId: string): Promise<boolean> => {
    try {
      const docRef = doc(db, 'vendorTag', vendorTagId);
      await deleteDoc(docRef);
      return true;
    } catch (e) {
      console.error('Error deleting vendorTag:', e);
      return false;
    }
  };

  static autoTagPastExpenses = async (startDate: number): Promise<number> => {
    try {
      const vendorTags: VendorTag[] = await FinanceStorage.getAllData('vendorTag');
      const vendorTagMap = new Map(vendorTags.map(vt => [vt.vendor.toLowerCase(), vt.tag]));

      if (vendorTagMap.size === 0) return 0;

      const expenseQuery = query(collection(db, 'expense'),
        where('modifiedDate', '>=', startDate));
      const querySnapshot = await getDocs(expenseQuery);

      let processedCount = 0;
      const expensesToUpdate: Expense[] = [];

      querySnapshot.forEach((doc) => {
        const expense = {id: doc.id, ...doc.data()} as Expense;
        if (expense.tag) return;

        const vendorLower = expense.vendor.toLowerCase();
        if (vendorTagMap.has(vendorLower)) {
          const newTag = vendorTagMap.get(vendorLower);
          if (newTag) {
            expensesToUpdate.push({
              ...expense,
              tag: newTag,
              modifiedDate: Date.now(),
            });
          }
        }
      });

      if (expensesToUpdate.length > 0) {
        processedCount = expensesToUpdate.length;
        const batchSize = 700;

        for (let i = 0; i < expensesToUpdate.length; i += batchSize) {
          const batch = expensesToUpdate.slice(i, i + batchSize);
          const updatePromises = batch.map(async (expense) => {
            const {id, ...expenseWithoutId} = expense;
            if (id) {
              const docRef = doc(db, 'expense', id);
              await setDoc(docRef, expenseWithoutId);
            }
          });

          await Promise.all(updatePromises);
          await FinanceStorage.addExpenseList(batch);

          if (i + batchSize < expensesToUpdate.length) {
            await sleep(1500);
          }
        }
      }

      return processedCount;
    } catch (e) {
      console.error('Error during auto-tagging process: ', e);
      return 0;
    }
  };

  static addBudget = async (_budget: Budget, operation = 'update'): Promise<Budget> => {
    try {
      const budget = JSONCopy(_budget);
      const key = budget.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();

      budget.modifiedDate = Date.now();
      budget.operation = operation;

      const docRef = doc(db, 'budget', key);
      const {id, ...budgetWithoutId} = budget;
      await setDoc(docRef, budgetWithoutId);

      budget.id = key;
      await FinanceStorage.addBudgetList([budget]);

      return budget;
    } catch (e) {
      console.error('Error adding budget: ', e, _budget);
      return _budget;
    }
  };

  static updateBudget = async (_budget: Budget): Promise<Budget> => {
    try {
      const budget = JSONCopy(_budget);
      budget.modifiedDate = Date.now();
      budget.operation = 'update';

      const docRef = doc(db, 'budget', budget.id);
      const {id, ...budgetWithoutId} = budget;
      await setDoc(docRef, budgetWithoutId);

      await FinanceStorage.addBudgetList([budget]);
      return budget;
    } catch (e) {
      console.error('Error updating budget: ', e, _budget);
      return _budget;
    }
  };

  static deleteBudget = async (budget: Budget): Promise<boolean> => {
    try {
      const docRef = doc(db, 'budget', budget.id);
      await deleteDoc(docRef);
      await FinanceStorage.deleteBudget(budget.id);
      return true;
    } catch (e) {
      console.error('Error deleting budget:', e);
      return false;
    }
  };

  static getBudgetList = async (overrideLastDate: number | undefined = undefined): Promise<Budget[]> => {
    try {
      const table = 'budget';
      let indexDocList: Budget[];
      const fireDocList: Budget[] = [];
      let lastUpdatedDate = getUnixTimestamp('2020-01-01');

      const configData = await FinanceStorage.getData('config', BUDGET_LAST_UPDATE);
      if (configData && 'value' in configData) lastUpdatedDate = Number(configData.value);
      if (overrideLastDate) lastUpdatedDate = overrideLastDate;

      const q = query(collection(db, table), where('modifiedDate', '>=', lastUpdatedDate));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.docs.length) {
        fireDocList.push(...querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Budget)));
        await FinanceStorage.addBudgetList(fireDocList);
      }

      await FinanceStorage.addConfig([{key: BUDGET_LAST_UPDATE, value: Date.now() - 3600000}]);
      indexDocList = await FinanceStorage.getAllData('budget');
      indexDocList = indexDocList.filter((item: Budget) => item.operation !== 'delete');
      return indexDocList;
    } catch (e) {
      console.error('Error fetching budget list: ', e);
      return [];
    }
  };
}
