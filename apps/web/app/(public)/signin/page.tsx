import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/routes.constant';
import { readSession } from '@/lib/session/session.service';
import { SignInPrompt } from './_components/sign-in-prompt';
import { SignInSearchParams } from './_lib/sign-in-search-params.schema';

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

type SignInPageProps = {
  /** Better Auth sends a failed attempt back here with `?error=<code>`. */
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  if (await readSession()) {
    redirect(ROUTES.home);
  }
  const { error } = SignInSearchParams.parse(await searchParams);

  return <SignInPrompt didSignInFail={error !== undefined} />;
}
