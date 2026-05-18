import { SYSTEM_CONFIG } from '../constants/systemConfig';

export const formatCurrency = (amount: number): string =>
  `${SYSTEM_CONFIG.CURRENCY_SYMBOL}${amount.toLocaleString()}`;

export const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};
