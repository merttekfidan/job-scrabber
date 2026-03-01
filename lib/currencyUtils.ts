/**
 * Utility functions for inferring and formatting local currencies
 * based on job locations.
 */

interface CurrencyInfo {
  symbol: string;
  code: string;
}

const locationToCurrencyMap: Record<string, CurrencyInfo> = {
  us: { symbol: '$', code: 'USD' },
  usa: { symbol: '$', code: 'USD' },
  'united states': { symbol: '$', code: 'USD' },
  canada: { symbol: 'C$', code: 'CAD' },
  brazil: { symbol: 'R$', code: 'BRL' },
  mexico: { symbol: '$', code: 'MXN' },
  uk: { symbol: '£', code: 'GBP' },
  'united kingdom': { symbol: '£', code: 'GBP' },
  london: { symbol: '£', code: 'GBP' },
  ireland: { symbol: '€', code: 'EUR' },
  germany: { symbol: '€', code: 'EUR' },
  france: { symbol: '€', code: 'EUR' },
  spain: { symbol: '€', code: 'EUR' },
  italy: { symbol: '€', code: 'EUR' },
  netherlands: { symbol: '€', code: 'EUR' },
  amsterdam: { symbol: '€', code: 'EUR' },
  sweden: { symbol: 'kr', code: 'SEK' },
  norway: { symbol: 'kr', code: 'NOK' },
  denmark: { symbol: 'kr', code: 'DKK' },
  switzerland: { symbol: 'CHF', code: 'CHF' },
  poland: { symbol: 'zł', code: 'PLN' },
  turkey: { symbol: '₺', code: 'TRY' },
  istanbul: { symbol: '₺', code: 'TRY' },
  uae: { symbol: 'AED', code: 'AED' },
  dubai: { symbol: 'AED', code: 'AED' },
  'south africa': { symbol: 'R', code: 'ZAR' },
  nigeria: { symbol: '₦', code: 'NGN' },
  india: { symbol: '₹', code: 'INR' },
  japan: { symbol: '¥', code: 'JPY' },
  china: { symbol: '¥', code: 'CNY' },
  singapore: { symbol: 'S$', code: 'SGD' },
  australia: { symbol: 'A$', code: 'AUD' },
  'new zealand': { symbol: 'NZ$', code: 'NZD' },
  'south korea': { symbol: '₩', code: 'KRW' },
  indonesia: { symbol: 'Rp', code: 'IDR' },
  philippines: { symbol: '₱', code: 'PHP' },
};

const euCountries = [
  'austria', 'belgium', 'cyprus', 'estonia', 'finland', 'greece', 'latvia',
  'lithuania', 'luxembourg', 'malta', 'portugal', 'slovakia', 'slovenia',
];

export function getCurrencyInfo(location: string | null | undefined): CurrencyInfo {
  if (!location) return { symbol: '$', code: 'USD' };
  const locLower = location.toLowerCase();
  for (const [key, currency] of Object.entries(locationToCurrencyMap)) {
    if (locLower.includes(key)) return currency;
  }
  if (euCountries.some((c) => locLower.includes(c))) {
    return { symbol: '€', code: 'EUR' };
  }
  return { symbol: '$', code: 'USD' };
}

const existingSymbols = ['$', '€', '£', '¥', '₹', '₺', 'Rp', 'CHF', 'kr', 'zł', 'AED'];

export function formatSalary(salary: string | null | undefined, location: string | null | undefined): string {
  if (!salary) return 'Not specified';
  for (const sym of existingSymbols) {
    if (salary.includes(sym)) return salary;
  }
  const { symbol } = getCurrencyInfo(location);
  return `${symbol}${salary}`;
}
