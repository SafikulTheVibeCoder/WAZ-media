/**
 * Bangladesh Mobile Number & bKash Transaction Validation Utilities
 */

export const INITIAL_BKASH_NUMBER = '0131198501';

/**
 * Normalize a Bangladesh mobile number by stripping whitespace/dashes
 * and converting +8801XXXXXXXXX or 8801XXXXXXXXX to 01XXXXXXXXX.
 */
export function normalizeBdMobileNumber(input: string): string {
  const cleaned = input.replace(/[\s\-()]/g, '').trim();
  if (cleaned.startsWith('+8801')) {
    return '0' + cleaned.slice(4);
  }
  if (cleaned.startsWith('8801')) {
    return '0' + cleaned.slice(3);
  }
  return cleaned;
}

/**
 * Validate standard 11-digit Bangladesh mobile numbers (013-019 prefix).
 */
export function isValidBdMobileNumber(input: string): boolean {
  const normalized = normalizeBdMobileNumber(input);
  return /^01[3-9]\d{8}$/.test(normalized);
}

/**
 * Normalize bKash Transaction ID (uppercase, trimmed).
 */
export function normalizeTransactionId(input: string): string {
  return input.trim().toUpperCase();
}

/**
 * Validate bKash Transaction ID format (alphanumeric/dash/underscore, 4-64 chars).
 */
export function isValidTransactionId(input: string): boolean {
  const normalized = normalizeTransactionId(input);
  return /^[A-Z0-9_-]{4,64}$/.test(normalized);
}
