import type { Metadata } from 'next';
import { SettingsSectionHead } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-section-head';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { WorkspaceSection } from './_components/workspace-section';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Workspace',
  robots: { index: false, follow: false },
};

/** The Workspace this device is in, the person's Role there, switching, and leaving. */
export default async function Workspace() {
  const session = await requireMember();

  return (
    <>
      <SettingsSectionHead href={ROUTES.settings.workspace} />
      <WorkspaceSection session={session} />
    </>
  );
}
