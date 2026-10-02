import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { OneTimeToast } from '@/app/(public)/_components/one-time-toast';
import { readSession } from '@/app/(public)/_lib/session.service';
import { IntroduceYourselfCard } from './_components/introduce-yourself-card';
import { IntroduceYourselfHero } from './_components/introduce-yourself-hero';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Introduce yourself',
  robots: { index: false, follow: false },
};

/**
 * The check is in the page, not a layout, because a layout does not re-run when the client
 * navigates between the pages under it.
 */
type IntroduceYourselfPageProps = {
  /** `signedIn` is set when Google sent a new person here after their first sign-in. */
  searchParams: Promise<{ signedIn?: string | string[] }>;
};

export default async function IntroduceYourselfPage({
  searchParams,
}: IntroduceYourselfPageProps) {
  const session = await readSession();
  if (!session) {
    redirect('/login');
  }
  const { signedIn } = await searchParams;

  return (
    <div className="m-auto grid w-full max-w-5xl items-center gap-10 md:grid-cols-2 md:gap-12">
      {signedIn !== undefined && (
        <OneTimeToast
          type="success"
          message={`Signed in as ${session.email}`}
          then="/register/introduce-yourself"
        />
      )}
      <IntroduceYourselfHero />
      <IntroduceYourselfCard email={session.email} name={session.name} />
    </div>
  );
}
