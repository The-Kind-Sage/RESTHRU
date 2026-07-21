import * as z from 'zod';

export type PhoneValidationResult = {
  valid: boolean;
  error?: string;
};

// Nepal: NTC (984,985,986,974,975) or Ncell (980,981,982,970,971) + 7 digits
const NEPAL_REGEX = /^(984|985|986|974|975|980|981|982|970|971)\d{7}$/;

export function validatePhone(phone: string): PhoneValidationResult {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  if (!/^\d{10}$/.test(cleaned)) {
    return {
      valid: false,
      error: 'Phone number must be exactly 10 digits',
    };
  }

  if (NEPAL_REGEX.test(cleaned)) {
    return { valid: true };
  }

  return {
    valid: false,
    error: 'Only Nepal mobile numbers are allowed (NTC: 984,985,986,974,975 | Ncell: 980,981,982,970,971)',
  };
}

export function phonePlaceholder(): string {
  return '98XXXXXXXX (Nepal mobile)';
}

export const phoneSchema = z.string().refine((val) => {
  const result = validatePhone(val);
  return result.valid;
}, 'Only Nepal mobile numbers are allowed (10 digits, starts with 984,985,986,974,975,980,981,982,970,971)');
