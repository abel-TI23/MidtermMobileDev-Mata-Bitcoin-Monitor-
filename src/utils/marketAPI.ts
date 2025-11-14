export interface GlobalMarketData {
  btcDominance: number;
  ethDominance?: number;
  totalMarketCapUsd?: number;
  updatedAt?: number;
}

const COINGECKO_GLOBAL = [
  'https://api.coingecko.com/api/v3/global',
  'https://www.coingecko.com/api/v3/global',
] as const;

export async function fetchGlobalMarket(): Promise<GlobalMarketData> {
  let lastErr: any;
  for (const host of COINGECKO_GLOBAL) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(host, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const d = json?.data || {};
      const mcap: Record<string, number> = d?.market_cap_percentage || {};
      const totalCap: Record<string, number> = d?.total_market_cap || {};
      return {
        btcDominance: typeof mcap?.btc === 'number' ? mcap.btc : Number(mcap?.btc || 0),
        ethDominance: typeof mcap?.eth === 'number' ? mcap.eth : Number(mcap?.eth || 0),
        totalMarketCapUsd: typeof totalCap?.usd === 'number' ? totalCap.usd : Number(totalCap?.usd || 0),
        updatedAt: d?.updated_at || Date.now(),
      };
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw lastErr || new Error('Unable to fetch global market data');
}
