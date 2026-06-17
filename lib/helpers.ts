/**
 * General helper utilities for common operations
 */

import { cn } from './utils';

// Re-export cn from utils to keep it available here
export { cn };

/**
 * Generates a random order number
 * @returns Order number like "ORD-1234"
 */
export function generateOrderNumber(): string {
  const randomFour = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `ORD-${randomFour}`;
}

/**
 * Gets a greeting based on the current time of day
 * @returns Greeting like "Good morning", "Good afternoon", or "Good evening"
 */
export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 18) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

/**
 * Gets the Tailwind color class for a given status
 * @param status - The status string (e.g., "pending", "completed", "cancelled")
 * @returns Tailwind color class like "bg-yellow-100" or "text-green-600"
 */
export function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase();

  const statusColorMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    confirmed: 'bg-green-100 text-green-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800',
    failed: 'bg-red-100 text-red-800',
    available: 'bg-green-100 text-green-800',
    occupied: 'bg-red-100 text-red-800',
    reserved: 'bg-orange-100 text-orange-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
  };

  return statusColorMap[statusLower] || 'bg-gray-100 text-gray-800';
}

/**
 * Gets the initials from a full name
 * @param name - Full name like "John Doe"
 * @returns Initials like "JD"
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 0) {
    return '';
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Calculates tax on an amount
 * @param amount - The amount to calculate tax on
 * @param rate - Tax rate as a percentage (default 13 for 13%)
 * @returns Calculated tax amount
 */
export function calculateTax(amount: number, rate: number = 13): number {
  return Math.round((amount * rate) / 100);
}

/**
 * Triggers a file download by creating a temporary link
 * @param url - The URL to download from
 * @param filename - The filename to save as
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Converts text to a URL-friendly slug
 * @param text - Text to convert to slug
 * @returns Slug like "hello-world"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}
