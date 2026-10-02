import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { readSession } from '@/app/(public)/_lib/session.service';
import { SignInPrompt } from './_components/sign-in-prompt';

const title = 'Are you ready to Thrive?';
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

type LoginPageProps = {
  /** Better Auth sends a failed attempt back here with `?error=<code>`. */
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await readSession()) {
    redirect('/home');
  }
  const { error } = await searchParams;

  return <SignInPrompt didSignInFail={error !== undefined} />;
}
