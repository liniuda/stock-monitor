export interface MarketIndex {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  amount: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
}

export interface Sector {
  code: string;
  name: string;
  changePercent: number;
  change: number;
  price: number;
  amount: number;
  volume: number;
  amplitude: number;
  turnoverRate: number;
  leadingStock: string;
  leadingStockChange: number;
  mainNetInflow: number;
  mainNetInflowPercent: number;
}

export interface Stock {
  code: string;
  name: string;
  price: number;
  changePercent: number;
  change: number;
  volume: number;
  amount: number;
  amplitude: number;
  turnoverRate: number;
  volumeRatio: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  totalMarketCap: number;
}

export interface ApiResponse<T> {
  data: T;
  timestamp: number;
}
