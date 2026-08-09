import AsyncStorage from '@react-native-async-storage/async-storage';
import {FinanceStorage} from '../../../api/FinanceStorage';
import {resetFirebaseMock, seedCollection} from '../../helpers/mockFirebase';
import {makeVendorTag} from '../../fixtures/factories';

import {ExpenseAPI} from '../../../api/ExpenseAPI';

describe('FinanceStorage vendor tags', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('adds and updates vendor tags by vendor key', async () => {
    await FinanceStorage.addVendorTag(makeVendorTag({vendor: 'swiggy', tag: 'Food'}));
    await FinanceStorage.addVendorTag(makeVendorTag({vendor: 'swiggy', tag: 'Dining', id: 'vt-2'}));
    await FinanceStorage.addVendorTag(makeVendorTag({vendor: 'uber', tag: 'Travel'}));

    const all = await FinanceStorage.getAllData('vendorTag');
    expect(all).toHaveLength(2);
    expect(all.find((t: {vendor: string}) => t.vendor === 'swiggy').tag).toBe('Dining');
  });
});

describe('ExpenseAPI vendor tags', () => {
  beforeEach(() => {
    resetFirebaseMock();
  });

  it('updates a vendor tag document', async () => {
    const ok = await ExpenseAPI.updateVendorTag(
      makeVendorTag({id: 'vt-1', vendor: 'swiggy', tag: 'Food'}),
    );
    expect(ok).toBe(true);
  });

  it('deletes a vendor tag document', async () => {
    seedCollection('vendorTag', [{id: 'vt-1', data: {vendor: 'swiggy', tag: 'Food'}}]);
    const ok = await ExpenseAPI.deleteVendorTag('vt-1');
    expect(ok).toBe(true);
  });
});
