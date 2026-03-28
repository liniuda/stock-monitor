export function formatAmount(value: number): string {
  if (value === 0) return "--";
  const abs = Math.abs(value);
  if (abs >= 1e12) return (value / 1e12).toFixed(2) + "万亿";
  if (abs >= 1e8) return (value / 1e8).toFixed(2) + "亿";
  if (abs >= 1e4) return (value / 1e4).toFixed(2) + "万";
  return value.toFixed(2);
}

export function formatPrice(value: number): string {
  if (value === 0) return "--";
  return value.toFixed(2);
}

export function formatPercent(value: number): string {
  if (value === 0) return "0.00%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatChange(value: number): string {
  if (value === 0) return "0.00";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

export function formatVolume(value: number): string {
  if (value === 0) return "--";
  const abs = Math.abs(value);
  if (abs >= 1e8) return (value / 1e8).toFixed(2) + "亿手";
  if (abs >= 1e4) return (value / 1e4).toFixed(2) + "万手";
  return value.toFixed(0) + "手";
}

export function formatMarketCap(value: number): string {
  if (value === 0) return "--";
  const abs = Math.abs(value);
  if (abs >= 1e12) return (value / 1e12).toFixed(2) + "万亿";
  if (abs >= 1e8) return (value / 1e8).toFixed(2) + "亿";
  return formatAmount(value);
}
