import type { Metadata } from 'next';
import { Caveat, Google_Sans } from 'next/font/google';
import localFont from 'next/font/local';
import { Toaster } from '@/components/atoms/toaster';
import { THEME_INIT_SCRIPT } from '@/lib/theme.constant';
import './globals.css';

/**
 * The token layer names the families (`--family-main`, `--family-display`, `--family-handwrite`);
 * this loads them. Google Sans is the main face and Caveat the handwrite face, both from Google
 * Fonts. Cooper is the display face, used
 * only at SemiBold, so that is the one file shipped; it is SIL OFL 1.1 and its licence sits
 * beside it, which the licence requires of anything redistributing it.
 *
 * The variables go on `<html>`, not `<body>`: the families are declared on `:root` and
 * resolve these variables there, so on `<body>` they would be undefined at the point of use
 * and the page would silently fall back to the system font.
 *
 * Next.js builds a resized backup face only for Google fonts it has measurements for, and it has
 * none for Google Sans: asked to, it logs a warning and builds nothing. So the backup face is
 * named here and declared, with measured values, in the token layer's supplement.
 * Naming a `fallback` is what stops Turbopack looking; `adjustFontFallback` stops webpack.
 */
const googleSans = Google_Sans({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Google Sans Fallback'],
  adjustFontFallback: false,
  variable: '--font-google-sans',
});

const caveat = Caveat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-caveat',
});

const cooper = localFont({
  src: './_lib/fonts/cooper/Cooper-SemiBold.woff2',
  weight: '600',
  display: 'swap',
  variable: '--font-cooper',
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
 * `Toaster` is here because a toast raised on one route may outlive it: it has to be mounted
 * above every route to stay on screen through a navigation.
 *
 * The head script applies a saved dark mode before the first paint, so that page does not flash
 * light first. It changes `data-theme` before React hydrates, which is why `<html>` suppresses the
 * mismatch warning — for its own attributes only, not for anything beneath it.
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
    <html
      lang="en"
      data-theme="light"
      className={`${googleSans.variable} ${caveat.variable} ${cooper.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: a constant from this repo, not input; inlining it is what lets it run before paint.
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-dvh">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
