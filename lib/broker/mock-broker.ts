import type { BrokerAssets } from "./types";

/**
 * Fetch account assets from real broker.
 * Currently returns null (not connected).
 * In the future this will call the real broker API (easytrader / QMT).
 */
export async function fetchAccountAssets(): Promise<BrokerAssets | null> {
  // Not connected yet — return null to indicate "待连接" state
  return null;
}
