import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

/**
 * The token layer names the family (`--family-sans`); this loads it. Inter carries everything
 * for now — the old build's display face is licensed, so it waits on that being confirmed.
 *
 * The variable goes on `<html>`, not `<body>`: `--family-sans` is declared on `:root` and
 * resolves `var(--font-inter)` there, so on `<body>` it would be undefined at the point of use
 * and the page would silently fall back to the system font.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Thrive',
    template: '%s · Thrive',
  },
  description: 'Ask for, give and act on feedback.',
};

/**
 * The root layout holds what persists across every route: the document shell,
 * the font variables, the token host. It reads nothing, because a read here is a read for
 * every route beneath it including the ones that do not need it.
 *
 * It stays a server component. When a provider is needed it goes in a thin
 * client wrapper this renders, never here: a layout is the highest node in its subtree, so
 * a directive on it hands the whole route group to the browser.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
