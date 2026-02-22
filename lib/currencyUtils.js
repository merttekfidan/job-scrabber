/**
 * Utility functions for inferring and formatting local currencies 
 * based on job locations.
 */

const locationToCurrencyMap = {
    // US & Americas
    'us': { symbol: '$', code: 'USD' },
    'usa': { symbol: '$', code: 'USD' },
    'united states': { symbol: '$', code: 'USD' },
    'canada': { symbol: 'C$', code: 'CAD' },
    'brazil': { symbol: 'R$', code: 'BRL' },
    'mexico': { symbol: '$', code: 'MXN' },

    // Europe
    'uk': { symbol: '£', code: 'GBP' },
    'united kingdom': { symbol: '£', code: 'GBP' },
    'london': { symbol: '£', code: 'GBP' },
    'ireland': { symbol: '€', code: 'EUR' },
    'germany': { symbol: '€', code: 'EUR' },
    'france': { symbol: '€', code: 'EUR' },
    'spain': { symbol: '€', code: 'EUR' },
    'italy': { symbol: '€', code: 'EUR' },
    'netherlands': { symbol: '€', code: 'EUR' },
    'amsterdam': { symbol: '€', code: 'EUR' },
    'sweden': { symbol: 'kr', code: 'SEK' },
    'norway': { symbol: 'kr', code: 'NOK' },
    'denmark': { symbol: 'kr', code: 'DKK' },
    'switzerland': { symbol: 'CHF', code: 'CHF' },
    'poland': { symbol: 'zł', code: 'PLN' },

    // Middle East & Africa
    'turkey': { symbol: '₺', code: 'TRY' },
    'istanbul': { symbol: '₺', code: 'TRY' },
    'uae': { symbol: 'AED', code: 'AED' },
    'dubai': { symbol: 'AED', code: 'AED' },
    'south africa': { symbol: 'R', code: 'ZAR' },
    'nigeria': { symbol: '₦', code: 'NGN' },

    // Asia & Pacific
    'india': { symbol: '₹', code: 'INR' },
    'japan': { symbol: '¥', code: 'JPY' },
    'china': { symbol: '¥', code: 'CNY' },
    'singapore': { symbol: 'S$', code: 'SGD' },
    'australia': { symbol: 'A$', code: 'AUD' },
    'new zealand': { symbol: 'NZ$', code: 'NZD' },
    'south korea': { symbol: '₩', code: 'KRW' },
    'indonesia': { symbol: 'Rp', code: 'IDR' },
    'philippines': { symbol: '₱', code: 'PHP' }
};

/**
 * Extracts the currency info from the location string
 */
export function getCurrencyInfo(location) {
    if (!location) return { symbol: '$', code: 'USD' }; // Default fallback

    let locLower = location.toLowerCase();

    // Check for exact matches or "city, country" matches
    for (const [key, currency] of Object.entries(locationToCurrencyMap)) {
        if (locLower.includes(key)) {
            return currency;
        }
    }

    // Check if it's an EU country not explicitly listed
    const euCountries = ['austria', 'belgium', 'cyprus', 'estonia', 'finland', 'greece', 'latvia', 'lithuania', 'luxembourg', 'malta', 'portugal', 'slovakia', 'slovenia'];
    if (euCountries.some(c => locLower.includes(c))) {
        return { symbol: '€', code: 'EUR' };
    }

    return { symbol: '$', code: 'USD' }; // global fallback
}

/**
 * Formats a salary string with the correct currency symbol based on location.
 * If the salary already has a known currency symbol, it preserves it.
 */
export function formatSalary(salary, location) {
    if (!salary) return 'Not specified';

    // If salary already has €, £, ¥, ₹, ₺, etc., just return it
    const existingSymbols = ['$', '€', '£', '¥', '₹', '₺', 'Rp', 'CHF', 'kr', 'zł', 'AED'];
    for (const sym of existingSymbols) {
        if (salary.includes(sym)) {
            return salary;
        }
    }

    const { symbol } = getCurrencyInfo(location);
    return `${symbol}${salary}`;
}
