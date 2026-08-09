import AsyncStorage from '@react-native-async-storage/async-storage';
import {FinanceStorage} from '../../../api/FinanceStorage';
import {resetFirebaseMock, seedCollection} from '../../helpers/mockFirebase';
import {makeVendorTag, ms} from '../../fixtures/factories';
import {TAG_LAST_UPDATE} from '../../../utility/constants';
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

describe('ExpenseAPI.getVendorTagList', () => {
  let mockGetData: jest.SpyInstance;
  let mockAddVendorTag: jest.SpyInstance;
  let mockAddConfig: jest.SpyInstance;
  let mockGetAllData: jest.SpyInstance;

  beforeEach(() => {
    resetFirebaseMock();
    mockGetData = jest.spyOn(FinanceStorage, 'getData').mockResolvedValue(undefined);
    mockAddVendorTag = jest.spyOn(FinanceStorage, 'addVendorTag').mockResolvedValue(undefined);
    mockAddConfig = jest.spyOn(FinanceStorage, 'addConfig').mockResolvedValue(undefined);
    mockGetAllData = jest.spyOn(FinanceStorage, 'getAllData').mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses TAG_LAST_UPDATE, merges newer docs, advances config, returns local list', async () => {
    mockGetData.mockResolvedValue({key: TAG_LAST_UPDATE, value: ms(2026, 1, 1)});
    seedCollection('vendorTag', [
      {
        id: 'new',
        data: {vendor: 'swiggy', tag: 'Food', date: ms(2026, 6, 1)},
      },
      {
        id: 'old',
        data: {vendor: 'uber', tag: 'Travel', date: ms(2025, 1, 1)},
      },
    ]);
    mockGetAllData.mockResolvedValue([
      makeVendorTag({id: 'new', vendor: 'swiggy', tag: 'Food'}),
      makeVendorTag({id: 'cached', vendor: 'amazon', tag: 'Shopping'}),
    ]);

    const list = await ExpenseAPI.getVendorTagList();

    expect(mockAddVendorTag).toHaveBeenCalledWith(
      expect.objectContaining({id: 'new', vendor: 'swiggy'}),
    );
    expect(mockAddVendorTag).not.toHaveBeenCalledWith(
      expect.objectContaining({id: 'old'}),
    );
    expect(mockAddConfig).toHaveBeenCalledWith([
      expect.objectContaining({key: TAG_LAST_UPDATE}),
    ]);
    expect(list.map(t => t.id)).toEqual(['new', 'cached']);
  });
});
