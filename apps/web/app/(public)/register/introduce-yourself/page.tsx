import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { readMockAccount } from '@/app/(public)/_lib/mock-session.service';
import { IntroduceYourselfCard } from './_components/introduce-yourself-card';
import { IntroduceYourselfHero } from './_components/introduce-yourself-hero';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('IntroduceYourself');
  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}

/**
 * The check is in the page, not a layout, because a layout does not re-run when the client
 * navigates between the pages under it.
 */
export default async function IntroduceYourselfPage() {
  const account = await readMockAccount();
  if (!account) {
    redirect('/login');
  }

  return (
    <div className="m-auto grid w-full max-w-5xl items-center gap-10 md:grid-cols-2 md:gap-12">
      <IntroduceYourselfHero />
      <IntroduceYourselfCard email={account.email} />
    </div>
  );
}
