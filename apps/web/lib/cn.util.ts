import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Joins class lists and resolves Tailwind conflicts, so a caller passing `p-6` replaces a
 * component's `p-4` instead of both landing and stylesheet order picking the winner.
 *
 * Later values win: pass the component's own classes first and the caller's `className` last.
 */
export function cn(...values: ClassValue[]): string {
  return twMerge(clsx(values));
}
