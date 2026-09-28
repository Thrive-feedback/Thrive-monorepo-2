import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
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
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh`}>
        {children}
      </body>
    </html>
  );
}
