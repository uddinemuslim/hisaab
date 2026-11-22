/**
 * Currency utility adhering to strict integer paise rules.
 * Rule: ALWAYS store amounts as integer paise (e.g. ₹100.50 = 10050).
 * Format to ₹ ONLY in UI. Never use floats for math.
 */

export const COLOR_GET = '#16A34A'; // Green: You will get / Money In
export const COLOR_GIVE = '#DC2626'; // Red: You will give / Money Out
export const COLOR_SETTLED = '#6B7280'; // Gray: Settled / Neutral

/**
 * Converts a rupee input string (e.g. "123.45", "100", "0.5") into exact integer paise.
 * Never uses float multiplication.
 */
export function parseRupeesToPaise(input: string): number {
  if (!input) return 0;
  
  // Clean whitespace, commas, ₹ symbols
  const cleaned = input.replace(/[^\d.]/g, '').trim();
  if (!cleaned) return 0;

  const parts = cleaned.split('.');
  const wholePartStr = parts[0] || '0';
  const fracPartStr = parts.length > 1 ? parts[1] : '';

  // Limit whole part to safe integer
  const whole = parseInt(wholePartStr, 10);
  if (isNaN(whole)) return 0;

  // Fraction up to 2 decimal places (paise)
  let frac = 0;
  if (fracPartStr.length === 1) {
    frac = parseInt(fracPartStr, 10) * 10;
  } else if (fracPartStr.length >= 2) {
    frac = parseInt(fracPartStr.substring(0, 2), 10);
  }

  return whole * 100 + frac;
}

/**
 * Formats integer paise to Rupee display string with ₹ prefix.
 * e.g. 10050 -> "₹100.50", 10000 -> "₹100", -25000 -> "₹250" (or "-₹250" if showSign is true)
 */
export function formatPaiseToRupees(
  paise: number,
  options?: {
    showSign?: boolean;
    alwaysDecimals?: boolean;
    absolute?: boolean;
  }
): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise));

  const whole = Math.floor(absPaise / 100);
  const fraction = absPaise % 100;

  // Format whole part with Indian comma groupings (e.g. 1,00,000)
  const wholeFormatted = formatIndianNumber(whole);

  let result = '';
  if (options?.alwaysDecimals || fraction > 0) {
    const fractionStr = fraction.toString().padStart(2, '0');
    result = `₹${wholeFormatted}.${fractionStr}`;
  } else {
    result = `₹${wholeFormatted}`;
  }

  if (!options?.absolute && isNegative) {
    return options?.showSign ? `-${result}` : result;
  }

  if (options?.showSign && paise > 0) {
    return `+${result}`;
  }

  return result;
}

/**
 * Formats a number with Indian numbering grouping (Lakhs, Crores).
 * e.g. 1000000 -> "10,00,000"
 */
export function formatIndianNumber(x: number): string {
  const s = Math.abs(Math.floor(x)).toString();
  if (s.length <= 3) return s;
  
  const lastThree = s.substring(s.length - 3);
  const otherNumbers = s.substring(0, s.length - 3);
  const withCommas = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${withCommas},${lastThree}`;
}

/**
 * Get color according to balance.
 * Balance > 0 : You will get (#16A34A)
 * Balance < 0 : You will give (#DC2626)
 * Balance == 0 : Settled (#6B7280)
 */
export function getBalanceColor(balancePaise: number): string {
  if (balancePaise > 0) return COLOR_GET;
  if (balancePaise < 0) return COLOR_GIVE;
  return COLOR_SETTLED;
}

/**
 * Get human readable status label.
 */
export function getBalanceStatus(balancePaise: number): 'GET' | 'GIVE' | 'SETTLED' {
  if (balancePaise > 0) return 'GET';
  if (balancePaise < 0) return 'GIVE';
  return 'SETTLED';
}

export function getBalanceLabel(balancePaise: number): string {
  if (balancePaise > 0) return 'You will get';
  if (balancePaise < 0) return 'You will give';
  return 'Settled';
}
