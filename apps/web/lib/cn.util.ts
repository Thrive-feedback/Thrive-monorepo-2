import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/*
 * tailwind-merge only knows Tailwind's default type scale. Our type utilities are the design's
 * roles (`text-body2`, `text-h1`), and an unknown `text-*` reads to it as a colour — so
 * `text-body2 text-foreground-muted` would lose its size. Naming the roles as font sizes keeps
 * both. The list mirrors the `--text-*` roles in `@repo/tokens`' theme.
 */
const TYPE_ROLES = [
  'display1',
  'display2',
  'display3',
  'display4',
  'display5',
  'display6',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'subtitle1',
  'subtitle2',
  'subtitle3',
  'subtitle4',
  'body1',
  'body2',
  'body3',
  'caption',
  'overline',
  'button-large',
  'button-medium',
  'button-small',
];

const twMerge = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: TYPE_ROLES }] } },
});

/**
 * Joins class lists and resolves Tailwind conflicts, so a caller passing `p-6` replaces a
 * component's `p-4` instead of both landing and stylesheet order picking the winner.
 *
 * Later values win: pass the component's own classes first and the caller's `className` last.
 */
export function cn(...values: ClassValue[]): string {
  return twMerge(clsx(values));
}
