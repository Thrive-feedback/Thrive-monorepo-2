import type { Metadata } from 'next';
import { LoginCard } from './_components/login-card';

const title = 'Welcome to Thrive';
const description = 'Sign in to Thrive with your Google account.';

/**
 * The title is absolute, skipping the layout's "· Thrive" template, so the tab says exactly
 * what the page's heading says.
 *
 * Indexable on purpose: someone searching for Thrive's login should land here. There is no
 * canonical URL, because it has to be absolute and the app has no production domain yet.
 */
export const metadata: Metadata = {
  title: { absolute: title },
  description,
  robots: { index: true, follow: true },
  openGraph: { title, description },
};

export default function LoginPage() {
  return <LoginCard />;
}
