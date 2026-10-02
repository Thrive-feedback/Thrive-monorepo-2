import Link from 'next/link';
import { redirect } from 'next/navigation';
import { OneTimeToast } from '@/app/(public)/_components/one-time-toast';
import { readSession } from '@/app/(public)/_lib/session.service';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';

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
  const session = await readSession();
  if (!session) {
    redirect('/login');
  }
  const { signedIn } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-12">
      {signedIn !== undefined && (
        <OneTimeToast
          type="success"
          message={`Signed in as ${session.email}`}
          then="/home"
        />
      )}
      <Text variant="display5" as="h1">
        Thrive
      </Text>
      <Text tone="muted">Ask for, give and act on feedback.</Text>
      <Button asChild variant="primary" size="sm" className="w-fit">
        <Link href="/ui-showcase">See the components</Link>
      </Button>
    </div>
  );
}
