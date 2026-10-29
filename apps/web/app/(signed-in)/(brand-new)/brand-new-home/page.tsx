import type { Metadata } from 'next';
import { OneTimeToast } from '@/components/atoms/one-time-toast';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { BrandNewHomeSearchParams } from './_lib/brand-new-home-search-params.schema';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Home',
  robots: { index: false, follow: false },
};

type BrandNewHomeProps = {
  /** `opened` is set when the person has just switched to this Workspace from the navbar. */
  searchParams: Promise<{ opened?: string | string[] }>;
};

/**
 * The Home that will replace the one Members land on, in the letter concept of the design
 * workspace. Empty for now: the frame, the navbar and the sidebar only, and Home's banner links
 * here.
 */
export default async function BrandNewHome({
  searchParams,
}: BrandNewHomeProps) {
  const { opened } = BrandNewHomeSearchParams.parse(await searchParams);
  const session = await requireMember();

  return (
    <>
      {opened !== undefined && (
        <OneTimeToast
          type="success"
          message={`Switched to ${session.membership.workspace.name}`}
          then={ROUTES.brandNewHome}
        />
      )}
      <h1 className="sr-only">Home</h1>
    </>
  );
}
