export interface WorldCurrency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rateToNgn: number; // 1 unit of currency = X NGN
  country: string;
}

export const WORLD_CURRENCIES: WorldCurrency[] = [
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', rateToNgn: 1, country: 'Nigeria' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', rateToNgn: 1500, country: 'United States' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', rateToNgn: 1920, country: 'United Kingdom' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rateToNgn: 1630, country: 'European Union' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦', rateToNgn: 1110, country: 'Canada' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', rateToNgn: 980, country: 'Australia' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', rateToNgn: 82, country: 'South Africa' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', rateToNgn: 208, country: 'China' },
];

export function getCurrency(code: string): WorldCurrency {
  return WORLD_CURRENCIES.find(c => c.code === code) || WORLD_CURRENCIES[0];
}

export function convertCurrency(
  amount: number,
  fromCode: string,
  toCode: string,
  liveUsdRate?: number
): number {
  const fromCurr = getCurrency(fromCode);
  const toCurr = getCurrency(toCode);

  // If live USD rate provided, adjust USD to NGN rate dynamically
  const fromRate = fromCode === 'USD' && liveUsdRate ? liveUsdRate : fromCurr.rateToNgn;
  const toRate = toCode === 'USD' && liveUsdRate ? liveUsdRate : toCurr.rateToNgn;

  // Convert fromSource to NGN first, then NGN to toTarget
  const amountInNgn = amount * fromRate;
  const targetAmount = amountInNgn / toRate;

  return targetAmount;
}

export function formatCurrencyAmount(amount: number, code: string): string {
  const curr = getCurrency(code);
  if (code === 'NGN') {
    return `${curr.symbol}${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  return `${curr.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
