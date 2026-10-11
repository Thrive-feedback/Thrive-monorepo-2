import type { Metadata } from 'next';
import { OneTimeToast } from '@/components/atoms/one-time-toast';
import { ROUTES } from '@/lib/routes.constant';
import { requireAccountToIntroduce } from '@/lib/session/session.service';
import { IntroduceYourselfCard } from './_components/introduce-yourself-card';
import { IntroduceYourselfHero } from './_components/introduce-yourself-hero';
import { IntroduceYourselfSearchParams } from './_lib/introduce-yourself-search-params.schema';

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
  /** `signedIn` is set when signing in led here: a first sign-in, or one that has not introduced itself yet. */
  searchParams: Promise<{ signedIn?: string | string[] }>;
};

export default async function IntroduceYourselfPage({
  searchParams,
}: IntroduceYourselfPageProps) {
  const { signedIn } = IntroduceYourselfSearchParams.parse(await searchParams);
  const session = await requireAccountToIntroduce(signedIn);

  return (
    <div className="m-auto grid w-full max-w-5xl items-center gap-10 md:grid-cols-2 md:gap-12">
      {signedIn !== undefined && (
        <OneTimeToast
          type="success"
          message={`Signed in as ${session.email}`}
          then={ROUTES.register.introduceYourself}
        />
      )}
      <IntroduceYourselfHero />
      <IntroduceYourselfCard email={session.email} name={session.name} />
    </div>
  );
}
