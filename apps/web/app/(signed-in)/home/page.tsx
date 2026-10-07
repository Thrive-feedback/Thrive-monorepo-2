import Link from 'next/link';
import { Button } from '@/components/atoms/button';
import { OneTimeToast } from '@/components/atoms/one-time-toast';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import { requireIntroducedAccount } from '@/lib/session/session.service';
import { HomeSearchParams } from './_lib/home-search-params.schema';

/**
 * Home, where a returning person lands after signing in; `/` stays public for the landing
 * page. Still deliberately empty of product: nothing is built ahead of the first real
 * feature, which replaces this.
 *
 * Every class resolves to a token: a role for colour, shape and type, a scale for spacing.
 * `bg-primary-500` is not a class that exists, because the theme exposes colour only as roles.
 */
type HomeProps = {
  /** `signedIn` is set when Google sent a returning person back here. */
  searchParams: Promise<{ signedIn?: string | string[] }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { signedIn } = HomeSearchParams.parse(await searchParams);
  const session = await requireIntroducedAccount(signedIn);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-12">
      {signedIn !== undefined && (
        <OneTimeToast
          type="success"
          message={`Signed in as ${session.email}`}
          then={ROUTES.home}
        />
      )}
      <Text variant="display-5" as="h1">
        Thrive
      </Text>
      <Text tone="muted">Ask for, give and act on feedback.</Text>
      <Button asChild variant="primary" size="sm" className="w-fit">
        <Link href={ROUTES.uiShowcase.index}>See the components</Link>
      </Button>
    </div>
  );
}
