import type { Metadata } from 'next';
import { OneTimeToast } from '@/components/atoms/one-time-toast';
import { ROUTES } from '@/lib/routes.constant';
import {
  readInvitationsWaiting,
  requireAccountToChooseWorkspace,
} from '@/lib/session/session.service';
import { readMyWorkspaces } from '@/lib/workspace/my-workspaces.service';
import { ChooseWorkspaceCard } from './_components/choose-workspace-card';
import { ChooseWorkspaceHero } from './_components/choose-workspace-hero';
import { ChooseWorkspaceSearchParams } from './_lib/choose-workspace-search-params.schema';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Choose a Workspace',
  robots: { index: false, follow: false },
};

type ChooseWorkspacePageProps = {
  /** `signedIn` is set when signing in led here. */
  searchParams: Promise<{ signedIn?: string | string[] }>;
};

/**
 * Where someone in more than one Workspace lands while this browser's session is in none: after
 * signing in, or once the Workspace it was in Deactivated them. The check is in the page, not a
 * layout, because a layout does not re-run when the client navigates between the pages under it.
 */
export default async function ChooseWorkspacePage({
  searchParams,
}: ChooseWorkspacePageProps) {
  const { signedIn } = ChooseWorkspaceSearchParams.parse(await searchParams);
  const account = await requireAccountToChooseWorkspace(signedIn);
  const [workspaces, invitations] = await Promise.all([
    readMyWorkspaces(),
    readInvitationsWaiting(),
  ]);

  return (
    <div className="m-auto grid w-full max-w-5xl items-center gap-10 md:grid-cols-2 md:gap-12">
      {signedIn !== undefined && (
        <OneTimeToast
          type="success"
          message={`Signed in as ${account.email}`}
          then={ROUTES.chooseWorkspace}
        />
      )}
      <ChooseWorkspaceHero />
      <ChooseWorkspaceCard workspaces={workspaces} invitations={invitations} />
    </div>
  );
}
