/**
 * Normalizes phone numbers for duplicate detection and comparison.
 * Strips non-digit characters and normalizes country codes/leading zeros for consistent matching.
 * Preserves the original customer-facing phone string when writing to database.
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  // For standard 10-digit mobile numbers with country code (e.g. 919876543210) or leading 0 (09876543210)
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}
