import type { Metadata } from 'next';
import { readOneOnOneTemplateCatalog } from '@/app/(signed-in)/(sidebar)/_lib/one-on-ones.service';
import { SettingsSectionHead } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-section-head';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { TemplateLibrary } from './_components/template-library';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: '1:1s',
  robots: { index: false, follow: false },
};

/**
 * How 1:1s are set up: the templates a meeting can use while it is prepared (brain ADR-0060 §8),
 * a card for each layer. Every Member keeps their own and copies any; an Admin also changes the
 * Workspace's, which everyone uses. New template sits at the end of a card's title, as Invite
 * people does on Teammates.
 */
export default async function OneOnOneSettings() {
  const { membership } = await requireMember();
  const catalog = await readOneOnOneTemplateCatalog(membership);

  return (
    <>
      <SettingsSectionHead href={ROUTES.settings.oneOnOnes} />
      <TemplateLibrary
        workspaceId={membership.workspace.id}
        workspaceName={membership.workspace.name}
        catalog={catalog}
      />
    </>
  );
}
