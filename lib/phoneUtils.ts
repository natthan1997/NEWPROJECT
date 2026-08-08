/**
 * Utility for normalizing & searching Thai phone numbers across the entire application.
 * Accepts: "+66812345678", "66812345678", "0812345678", "812345678", "081-234-5678"
 */

export interface NormalizedPhone {
  local: string;          // "0812345678"
  international: string;  // "+66812345678"
  last9: string;          // "812345678"
  isValid: boolean;
}

export function normalizePhone(raw: string | null | undefined): NormalizedPhone {
  if (!raw) {
    return { local: '', international: '', last9: '', isValid: false };
  }

  let digits = String(raw).trim().replace(/[^\d]/g, '');

  // Handle +66 or 66 prefix
  if (digits.startsWith('66') && digits.length >= 11) {
    digits = digits.slice(2);
  }

  // Handle 9-digit Thai mobile number missing leading 0 (e.g. 812345678 -> 0812345678)
  if (digits.length === 9 && ['2', '3', '5', '6', '8', '9'].includes(digits[0])) {
    digits = '0' + digits;
  }

  // Check valid Thai 10-digit format
  if (digits.length === 10 && digits.startsWith('0')) {
    const last9 = digits.slice(1);
    return {
      local: digits,
      international: `+66${last9}`,
      last9,
      isValid: true,
    };
  }

  // Fallback for non-standard or foreign numbers
  return {
    local: raw.trim(),
    international: raw.trim(),
    last9: digits,
    isValid: digits.length >= 8,
  };
}

/**
 * Formats a phone number for friendly display to users/staff.
 * Example: "+66840464216" -> "084-046-4216"
 */
export function formatPhoneDisplay(rawPhone: string | null | undefined): string {
  if (!rawPhone) return '';
  const norm = normalizePhone(rawPhone);
  if (!norm.local || norm.local.length !== 10) return rawPhone;
  return `${norm.local.slice(0, 3)}-${norm.local.slice(3, 6)}-${norm.local.slice(6)}`;
}

/**
 * Builds a Supabase .or() query string that matches display_name, full_name, or phone.
 * Seamlessly matches whether user types '084', '84', '+6684', or full 10 digits.
 */
export function buildMemberSearchFilter(searchTerm: string): string {
  const trimmed = searchTerm.trim();
  if (!trimmed) return '';

  let digits = trimmed.replace(/[^\d]/g, '');
  let coreDigits = digits;

  if (digits.startsWith('0')) {
    coreDigits = digits.slice(1);
  } else if (digits.startsWith('66') && digits.length >= 4) {
    coreDigits = digits.slice(2);
  }

  const filters = [
    `display_name.ilike.%${trimmed}%`,
    `full_name.ilike.%${trimmed}%`,
    `phone.ilike.%${trimmed}%`
  ];

  if (coreDigits && coreDigits.length >= 2 && coreDigits !== digits) {
    filters.push(`phone.ilike.%${coreDigits}%`);
  }

  return filters.join(',');
}

/**
 * Generates Supabase .or() query filter string for matching phone numbers in any format.
 */
export function getPhoneSearchOrFilter(rawPhone: string): string {
  const norm = normalizePhone(rawPhone);
  if (!norm.last9) return `phone.ilike.%${rawPhone}%`;
  
  const conditions = [
    `phone.eq.${norm.local}`,
    `phone.eq.${norm.international}`,
    `phone.ilike.%${norm.last9}`
  ];
  return conditions.join(',');
}
