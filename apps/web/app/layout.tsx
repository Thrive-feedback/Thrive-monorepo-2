import type { Metadata } from 'next';
import { Google_Sans } from 'next/font/google';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { Toaster } from '@/components/atoms/toaster';
import './globals.css';

/**
 * The token layer names the families (`--family-sans`, `--family-display`); this loads them.
 * Google Sans is the body face and comes from Google Fonts. Cooper is the display face, used
 * only at SemiBold, so that is the one file shipped; it is SIL OFL 1.1 and its licence sits
 * beside it, which the licence requires of anything redistributing it.
 *
 * The variables go on `<html>`, not `<body>`: the families are declared on `:root` and
 * resolve these variables there, so on `<body>` they would be undefined at the point of use
 * and the page would silently fall back to the system font.
 *
 * Next.js builds a resized backup face only for Google fonts it has measurements for, and it has
 * none for Google Sans: asked to, it logs a warning and builds nothing. So the backup face is
 * named here and declared, with measured values, in the token layer beside `--family-sans`.
 * Naming a `fallback` is what stops Turbopack looking; `adjustFontFallback` stops webpack.
 *
 * Google Sans carries Thai as well, so the one family covers both languages. Cooper has no Thai,
 * which is why the display family falls through to Google Sans in the token layer.
 */
const googleSans = Google_Sans({
  subsets: ['latin', 'thai'],
  display: 'swap',
  fallback: ['Google Sans Fallback'],
  adjustFontFallback: false,
  variable: '--font-google-sans',
});

const cooper = localFont({
  src: './_lib/fonts/cooper/Cooper-SemiBold.woff2',
  weight: '600',
  display: 'swap',
  variable: '--font-cooper',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return {
    title: {
      default: t('title'),
      template: `%s · ${t('title')}`,
    },
    description: t('description'),
  };
}

/**
 * The root layout holds what persists across every route: the document shell,
 * the font variables, the token host. It reads nothing, because a read here is a read for
 * every route beneath it including the ones that do not need it.
 *
 * `Toaster` is here because a toast raised on one route may outlive it: it has to be mounted
 * above every route to stay on screen through a navigation.
 *
 * It stays a server component. When a provider is needed it goes in a thin
 * client wrapper this renders, never here: a layout is the highest node in its subtree, so
 * a directive on it hands the whole route group to the browser. `NextIntlClientProvider` is
 * such a wrapper: it hands the request's language and messages to client components.
 *
 * `lang` follows the language, so a screen reader pronounces the page in it and the browser
 * picks Thai line breaking for Thai text.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${googleSans.variable} ${cooper.variable}`}>
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
