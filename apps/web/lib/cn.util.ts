import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/*
 * tailwind-merge only knows Tailwind's default type scale. Our type utilities are the design's
 * roles (`text-body-2`, `text-h1`), and an unknown `text-*` reads to it as a colour — so
 * `text-body-2 text-fg-secondary` would lose its size. Naming the roles as font sizes keeps
 * both. The list mirrors the `--text-*` roles in `@repo/tokens`' theme.
 */
const TYPE_ROLES = [
  'display-1',
  'display-2',
  'display-3',
  'display-4',
  'display-5',
  'display-6',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'subtitle-1',
  'subtitle-2',
  'subtitle-3',
  'subtitle-4',
  'subtitle-display-1',
  'subtitle-display-2',
  'subtitle-display-3',
  'subtitle-display-4',
  'subtitle-handwrite-1',
  'subtitle-handwrite-2',
  'subtitle-handwrite-3',
  'subtitle-handwrite-4',
  'body-1',
  'body-2',
  'body-3',
  'quote',
  'code',
  'button-md',
  'button-sm',
  'button-xs',
  'input-label-md',
  'input-label-sm',
  'input-label-xs',
  'input-value-md',
  'input-value-sm',
  'input-value-xs',
  'input-helper',
  'table-header',
  'list-subheader',
  'label',
  'caption',
  'overline',
  'tag',
];

/**
 * The same gap for shape: `rounded-element` is unknown to tailwind-merge, so a caller's
 * `rounded-full` would land beside it rather than replace it. Mirrors the `--radius-*` roles.
 */
const SHAPE_ROLES = [
  'none',
  'inner',
  'element',
  'container',
  'page',
  'surface',
  'button',
  'input',
  'chip',
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: TYPE_ROLES }],
      rounded: [{ rounded: SHAPE_ROLES }],
    },
  },
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
