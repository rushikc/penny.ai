import {FinanceStorage} from '../api/FinanceStorage';
import {
  DEFAULT_USD_TO_INR,
  FX_CACHE_TTL_MS,
  FX_RATE_LAST_UPDATE,
  FX_USD_INR_RATE,
} from './constants';

export type FxRate = {
  rate: number;
  fetchedAt: number;
  source: 'live' | 'cache' | 'fallback';
};

const FX_API_URL = 'https://open.er-api.com/v6/latest/USD';
const FETCH_TIMEOUT_MS = 6000;

async function readCachedRate(): Promise<{rate: number; fetchedAt: number} | null> {
  const rateEntry = await FinanceStorage.getData('config', FX_USD_INR_RATE);
  const timeEntry = await FinanceStorage.getData('config', FX_RATE_LAST_UPDATE);

  if (
    rateEntry &&
    'value' in rateEntry &&
    timeEntry &&
    'value' in timeEntry &&
    Number(rateEntry.value) > 0
  ) {
    return {
      rate: Number(rateEntry.value),
      fetchedAt: Number(timeEntry.value),
    };
  }

  return null;
}

async function writeCachedRate(rate: number, fetchedAt: number): Promise<void> {
  await FinanceStorage.addConfig([
    {key: FX_USD_INR_RATE, value: rate},
    {key: FX_RATE_LAST_UPDATE, value: fetchedAt},
  ]);
}

async function fetchLiveRate(): Promise<number> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(FX_API_URL, {signal: controller.signal});
    if (!response.ok) {
      throw new Error(`FX API responded with ${response.status}`);
    }

    const data = await response.json();
    const inrRate = data?.rates?.INR;

    if (data?.result !== 'success' || !Number.isFinite(inrRate) || inrRate <= 0) {
      throw new Error('FX API returned an invalid INR rate');
    }

    return inrRate;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getUsdToInrRate(forceRefresh = false): Promise<FxRate> {
  const cached = await readCachedRate();

  if (
    !forceRefresh &&
    cached &&
    Date.now() - cached.fetchedAt < FX_CACHE_TTL_MS
  ) {
    return {
      rate: cached.rate,
      fetchedAt: cached.fetchedAt,
      source: 'cache',
    };
  }

  try {
    const rate = await fetchLiveRate();
    const fetchedAt = Date.now();
    await writeCachedRate(rate, fetchedAt);
    return {rate, fetchedAt, source: 'live'};
  } catch (error) {
    console.error('Error fetching USD/INR rate:', error);

    if (cached) {
      return {
        rate: cached.rate,
        fetchedAt: cached.fetchedAt,
        source: 'fallback',
      };
    }

    return {
      rate: DEFAULT_USD_TO_INR,
      fetchedAt: Date.now(),
      source: 'fallback',
    };
  }
}
