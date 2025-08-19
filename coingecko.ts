import { tokens } from "./tokens";

interface TimeSeriesValue {
  timestamp: number;
  value: number;
}

interface PriceDataPoint {
  timestamp: number;
  price: number;
  volume: number;
  market_cap: number;
}

interface PriceHistoryResult {
  success: boolean;
  symbol?: string;
  data?: PriceDataPoint[];
  error?: string;
}

export async function getPriceHistory(
  ticker: string,
  days: number = 7
): Promise<PriceHistoryResult> {
  try {
    const cg_id = tokens.find((token) => token.symbol === ticker)?.cg_id;

    if (!cg_id) {
      return {
        success: false,
        error: `CoinGecko ID not found for token: ${ticker}`,
      };
    }

    if (days > 15) {
      return {
        success: false,
        error: "Price history should only be fetched for up to 15 days.",
      };
    }

    const raw = await fetch(
      `https://api.coingecko.com/api/v3/coins/${cg_id}/market_chart?vs_currency=usd&days=${days}`
    );

    if (!raw.ok) {
      return {
        success: false,
        error: `Failed to fetch data from CoinGecko: ${raw.status} ${raw.statusText}`,
      };
    }

    const res = await raw.json();

    // Combine all the data points into a single array
    const data: PriceDataPoint[] = res.prices.map(
      (price: [number, number], index: number) => ({
        timestamp: price[0],
        price: price[1],
        volume: res.total_volumes[index] ? res.total_volumes[index][1] : 0,
        market_cap: res.market_caps[index] ? res.market_caps[index][1] : 0,
      })
    );

    return {
      success: true,
      symbol: ticker,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error fetching price history: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}
