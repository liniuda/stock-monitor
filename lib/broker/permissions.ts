import type { TradingPermission } from "./types";

/**
 * Determine stock trading permission based on code prefix.
 * Returns which permission is needed to trade this stock.
 */
export function getRequiredPermission(stockCode: string): TradingPermission | null {
  if (stockCode.startsWith("60")) return "sh_a";
  if (stockCode.startsWith("00")) return "sz_a";
  if (stockCode.startsWith("300")) return "chinext";
  if (stockCode.startsWith("688")) return "star";
  if (stockCode.startsWith("8") || stockCode.startsWith("4")) return "bse";
  return null;
}

/**
 * Check if an account has permission to trade a given stock.
 */
export function canTrade(
  permissions: TradingPermission[],
  stockCode: string
): boolean {
  const required = getRequiredPermission(stockCode);
  if (!required) return false;
  return permissions.includes(required);
}

/**
 * Filter a list of stock codes to only those the account can trade.
 */
export function filterByPermissions(
  permissions: TradingPermission[],
  stockCodes: string[]
): string[] {
  return stockCodes.filter((code) => canTrade(permissions, code));
}
