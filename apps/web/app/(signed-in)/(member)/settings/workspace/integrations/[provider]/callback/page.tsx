import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChooseChannelForm } from '@/app/(signed-in)/(member)/settings/workspace/_components/choose-channel-form';
import { providerForSegment } from '@/app/(signed-in)/(member)/settings/workspace/_lib/chat-providers.constant';
import { completeInstall } from '@/app/(signed-in)/(member)/settings/workspace/_lib/installs.service';
import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Connecting',
  robots: { index: false, follow: false },
};

type CallbackProps = {
  params: Promise<{ provider: string }>;
  searchParams: Promise<{ code?: string; state?: string }>;
};

/**
 * Where a chat tool returns an Admin once they have authorised Thrive in it.
 *
 * It is an ordinary signed-in page, not an API route: the API has no public domain, so the tool
 * can only reach the web origin, and the session cookie travels on the tool's top-level
 * redirect because it is `sameSite: 'lax'` (design 0020 D4). Nothing here is public.
 *
 * It reads back what the tool says was authorised and asks which channel to post in. Nothing is
 * connected yet — an Admin who closes this page has left nothing behind.
 */
export default async function IntegrationCallback({
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
  const session = await requireMember();

  const completed =
    code && state
      ? await completeInstall(session.membership, provider.value, code, state)
      : ({
          ok: false,
          message: `${provider.label} did not say what was authorised, so nothing was connected. Start again from Settings.`,
        } as const);

  return (
    <section className="flex flex-col gap-4 py-5">
      <Text as="h2" variant="subtitle-2">
        Connecting {provider.label}
      </Text>
      {completed.ok ? (
        <ChooseChannelForm
          segment={segment}
          label={provider.label}
          spaceName={completed.install.spaceName}
          channels={completed.install.channels}
          installation={completed.install.installation}
          cleanAddress={ROUTES.settings.workspaceIntegrationCallback(segment)}
        />
      ) : (
        <>
          <Text variant="body-2" role="alert">
            {completed.message}
          </Text>
          <Link href={ROUTES.settings.workspace}>Back to Workspace</Link>
        </>
      )}
    </section>
  );
}
