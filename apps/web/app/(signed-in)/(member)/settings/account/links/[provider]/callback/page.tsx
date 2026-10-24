import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { completeAccountLink } from '@/app/(signed-in)/(member)/settings/account/_lib/account-links.service';
import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { providerForSegment } from '@/lib/chat/chat-providers.constant';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Linking',
  robots: { index: false, follow: false },
};

type CallbackProps = {
  params: Promise<{ provider: string }>;
  searchParams: Promise<{ code?: string; state?: string }>;
};

/**
 * Where a chat tool returns a Member once they have authorised Thrive to learn which account
 * there is theirs.
 *
 * It is an ordinary signed-in page, not an API route: the API has no public domain, so the tool
 * can only reach the web origin, and the session cookie travels on the tool's top-level
 * redirect because it is `sameSite: 'lax'` (design 0021 D10). Nothing here is public.
 *
 * On success it goes straight back to Settings → Account, where the row now names the account —
 * which also leaves the tool's single-use code behind rather than on screen.
 */
export default async function AccountLinkCallback({
  params,
  searchParams,
}: CallbackProps) {
  const [{ provider: segment }, { code, state }] = await Promise.all([
    params,
    searchParams,
  ]);
  const provider = providerForSegment(segment);
  if (!provider) {
    notFound();
  }
  await requireMember();

  const completed =
    code && state
      ? await completeAccountLink(provider.value, code, state)
      : ({
          ok: false,
          message: `${provider.label} did not say which account this is, so nothing was linked. Start again from Settings.`,
        } as const);

  if (completed.ok) {
    // Outside any try/catch: `redirect` works by throwing.
    redirect(ROUTES.settings.account);
  }

  return (
    <section className="flex flex-col gap-4 py-5">
      <Text as="h2" variant="subtitle-2">
        Linking {provider.label}
      </Text>
      <Text variant="body-2" role="alert">
        {completed.message}
      </Text>
      <Link href={ROUTES.settings.account}>Back to Account</Link>
    </section>
  );
}
