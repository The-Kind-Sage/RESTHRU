import * as z from 'zod';

export type PhoneCountry = 'NP' | 'IN' | null;

export type PhoneValidationResult = {
  valid: boolean;
  country: PhoneCountry;
  error?: string;
};

// Nepal: NTC (984,985,986,974,975) or Ncell (980,981,982,970,971) + 7 digits
const NEPAL_REGEX = /^(984|985|986|974|975|980|981|982|970|971)\d{7}$/;

// India: starts with 6,7,8,9 + 9 digits
const INDIA_REGEX = /^[6-9]\d{9}$/;

export function validatePhone(phone: string): PhoneValidationResult {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  if (!/^\d{10}$/.test(cleaned)) {
    return {
      valid: false,
      country: null,
      error: 'Phone number must be exactly 10 digits',
    };
  }

  if (NEPAL_REGEX.test(cleaned)) {
    return { valid: true, country: 'NP' };
  }

  if (INDIA_REGEX.test(cleaned)) {
    return { valid: true, country: 'IN' };
  }

  return {
    valid: false,
    country: null,
    error: 'Only Nepal (NTC/Ncell) and Indian mobile numbers are allowed',
  };
}

export function phonePlaceholder(): string {
  return '98XXXXXXXX (Nepal) or 6XXXXXXXXX (India)';
}

export const phoneSchema = z.string().refine((val) => {
  const result = validatePhone(val);
  return result.valid;
}, 'Only Nepal (NTC/Ncell) and Indian mobile numbers (10 digits) are allowed');
