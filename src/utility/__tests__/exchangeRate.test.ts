import {FinanceStorage} from '../../api/FinanceStorage';
import {
  DEFAULT_USD_TO_INR,
  FX_CACHE_TTL_MS,
  FX_RATE_LAST_UPDATE,
  FX_USD_INR_RATE,
} from '../constants';
import {getUsdToInrRate} from '../exchangeRate';

jest.mock('../../api/FinanceStorage');

const mockedGetData = FinanceStorage.getData as jest.Mock;
const mockedAddConfig = FinanceStorage.addConfig as jest.Mock;

const NOW = 1_700_000_000_000;
const LIVE_RATE = 95.42;

function mockCache(rate: number, fetchedAt: number) {
  mockedGetData.mockImplementation((_store: string, key: string) => {
    if (key === FX_USD_INR_RATE) {
      return Promise.resolve({key, value: rate});
    }
    if (key === FX_RATE_LAST_UPDATE) {
      return Promise.resolve({key, value: fetchedAt});
    }
    return Promise.resolve(undefined);
  });
}

function mockLiveFetch(rate = LIVE_RATE) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({result: 'success', rates: {INR: rate}}),
  });
}

describe('getUsdToInrRate', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetData.mockReset();
    mockedAddConfig.mockReset();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns cached rate without calling fetch when cache is fresh', async () => {
    mockCache(94.5, NOW - FX_CACHE_TTL_MS + 60_000);

    const result = await getUsdToInrRate();

    expect(result).toEqual({
      rate: 94.5,
      fetchedAt: NOW - FX_CACHE_TTL_MS + 60_000,
      source: 'cache',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches live rate when cache is stale and persists it', async () => {
    mockCache(94.5, NOW - FX_CACHE_TTL_MS - 1);
    mockLiveFetch();

    const result = await getUsdToInrRate();

    expect(result).toEqual({rate: LIVE_RATE, fetchedAt: NOW, source: 'live'});
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(mockedAddConfig).toHaveBeenCalledWith([
      {key: FX_USD_INR_RATE, value: LIVE_RATE},
      {key: FX_RATE_LAST_UPDATE, value: NOW},
    ]);
  });

  it('fetches live rate when no cache exists', async () => {
    mockedGetData.mockResolvedValue(undefined);
    mockLiveFetch();

    const result = await getUsdToInrRate();

    expect(result.source).toBe('live');
    expect(result.rate).toBe(LIVE_RATE);
  });

  it('bypasses fresh cache when forceRefresh is true', async () => {
    mockCache(94.5, NOW - 60_000);
    mockLiveFetch();

    const result = await getUsdToInrRate(true);

    expect(result.source).toBe('live');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to stale cache when fetch fails', async () => {
    const staleFetchedAt = NOW - FX_CACHE_TTL_MS - 1;
    mockCache(93.1, staleFetchedAt);
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    const result = await getUsdToInrRate();

    expect(result).toEqual({
      rate: 93.1,
      fetchedAt: staleFetchedAt,
      source: 'fallback',
    });
  });

  it('falls back to default constant when fetch fails and no cache exists', async () => {
    mockedGetData.mockResolvedValue(undefined);
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    const result = await getUsdToInrRate();

    expect(result).toEqual({
      rate: DEFAULT_USD_TO_INR,
      fetchedAt: NOW,
      source: 'fallback',
    });
  });

  it('treats invalid API payload as failure', async () => {
    mockedGetData.mockResolvedValue(undefined);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({result: 'error', rates: {INR: 0}}),
    });

    const result = await getUsdToInrRate();

    expect(result.source).toBe('fallback');
    expect(result.rate).toBe(DEFAULT_USD_TO_INR);
  });

  it('treats non-ok HTTP status as failure', async () => {
    mockedGetData.mockResolvedValue(undefined);
    (global.fetch as jest.Mock).mockResolvedValue({ok: false, status: 503});

    const result = await getUsdToInrRate();

    expect(result.source).toBe('fallback');
    expect(result.rate).toBe(DEFAULT_USD_TO_INR);
  });
});
