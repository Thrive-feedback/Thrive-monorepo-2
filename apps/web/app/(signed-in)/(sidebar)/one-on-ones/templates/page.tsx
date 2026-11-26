import { ArrowLeftIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { PageTitle } from '@/app/(signed-in)/(sidebar)/_components/page-title';
import { readOneOnOneTemplateCatalog } from '@/app/(signed-in)/(sidebar)/_lib/one-on-ones.service';
import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { NewTemplate, TemplateLibrary } from './_components/template-library';
import { TEMPLATES_COLUMN } from './_lib/templates-layout.constant';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: '1:1 templates',
  robots: { index: false, follow: false },
};

/**
 * The templates a 1:1's agenda opens with (brain ADR-0060 §8): the person's own, which only they
 * see; the Workspace's, which everyone starts from and its Admins change; and Thrive's, which
 * nobody changes. Any of them can be copied to become the person's own.
 */
export default async function OneOnOneTemplates() {
  const { membership } = await requireMember();
  const catalog = await readOneOnOneTemplateCatalog(membership);
  const { id: workspaceId, name: workspaceName } = membership.workspace;

  return (
    <div className={TEMPLATES_COLUMN}>
      <div className="flex flex-col gap-3">
        <Link
          href={ROUTES.oneOnOnes}
          className="inline-flex w-fit items-center gap-1.5 text-body-3"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          1:1s
        </Link>
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <div className="flex flex-col gap-1">
            <PageTitle>Templates</PageTitle>
            <Text as="p" variant="body-2" tone="muted">
              The questions a 1:1’s agenda opens with. Pick one when you create
              a 1:1, or change it with the schedule.
            </Text>
          </div>
          <div className="ms-auto">
            <NewTemplate
              workspaceId={workspaceId}
              workspaceName={workspaceName}
              mayKeepForWorkspace={catalog.mayKeepForWorkspace}
            />
          </div>
        </div>
      </div>
      <TemplateLibrary
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        catalog={catalog}
      />
    </div>
  );
}
