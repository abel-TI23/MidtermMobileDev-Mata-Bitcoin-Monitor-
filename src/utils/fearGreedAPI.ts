import { apiCache, CACHE_TTL } from './apiCache';

export type FearGreedData = {
  value: number; // 0 - 100
  classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  lastUpdated?: string; // ISO or human
};

const API_URL = 'https://api.alternative.me/fng/?limit=1&format=json';
const HISTORY_URL = 'https://api.alternative.me/fng/?limit=0&format=json'; // full history (API docs: limit=0)

function classify(value: number): FearGreedData['classification'] {
  if (value <= 24) return 'Extreme Fear';
  if (value <= 44) return 'Fear';
  if (value <= 55) return 'Neutral';
  if (value <= 74) return 'Greed';
  return 'Extreme Greed';
}

async function fetchFearGreedIndexRaw(): Promise<FearGreedData> {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(API_URL, { signal: controller.signal });
    clearTimeout(to);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    const item = json?.data?.[0];
    const value = Number(item?.value);
    const updated = item?.timestamp ? new Date(Number(item.timestamp) * 1000).toISOString() : undefined;
    if (!Number.isFinite(value)) throw new Error('Invalid Fear & Greed value');
    return { value, classification: classify(value), lastUpdated: updated };
  } catch (e) {
    clearTimeout(to);
    throw e;
  }
}

export async function fetchFearGreedIndex(): Promise<FearGreedData> {
  return apiCache.get('fearGreedIndex', fetchFearGreedIndexRaw, CACHE_TTL.FEAR_GREED);
}

export type FearGreedHistoryPoint = {
  time: number; // ms timestamp
  value: number;
  classification: FearGreedData['classification'];
};

export async function fetchFearGreedHistory(limit: number = 90): Promise<FearGreedHistoryPoint[]> {
  // limit parameter: number of days back (approx). We'll fetch full then slice.
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(HISTORY_URL, { signal: controller.signal });
    clearTimeout(to);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    const raw: any[] = json?.data || [];
    // Reverse chronological; convert and slice last N
    const points: FearGreedHistoryPoint[] = raw.map(item => {
      const v = Number(item?.value);
      const ts = Number(item?.timestamp) * 1000;
      return {
        time: ts,
        value: Number.isFinite(v) ? v : 0,
        classification: classify(v),
      };
    }).filter(p => p.value > 0);
    // Data appears newest first; ensure ascending by time
    points.sort((a,b) => a.time - b.time);
    return points.slice(-limit);
  } catch (e) {
    clearTimeout(to);
    throw e;
  }
}
