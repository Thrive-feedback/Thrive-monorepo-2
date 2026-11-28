'use client';

import { toast } from 'sonner';
import { SampleDataProvider } from '@/components/organisms/sample-data-provider';
import { ROUTES } from '@/lib/routes.constant';

/** Where a link stays in the showcase: another of its pages, or a place on this one. */
function staysHere(href: string): boolean {
  return (
    href.startsWith('#') ||
    href === ROUTES.uiShowcase.index ||
    href.startsWith(`${ROUTES.uiShowcase.index}/`)
  );
}

export type StayInShowcaseProps = {
  children: React.ReactNode;
};

/**
 * Keeps a showcase on sample data from leading into the app: a press on a link to the signed-in
 * product (a 1:1 in the list, a Profile, Settings) is held, and says why, rather than opening a
 * page that would ask to sign in or show someone else's data. Links between showcase pages still
 * work. It catches the press before the link sees it, through dialogs too, as React passes events
 * up through portals. What is under it is sample data, so nothing it does reaches the server
 * either: its Workspace is made up, and the server would take it for another Workspace's page.
 */
export function StayInShowcase({ children }: StayInShowcaseProps) {
  return (
    <div
      className="contents"
      onClickCapture={(event) => {
        const link =
          event.target instanceof Element
            ? event.target.closest('a[href]')
            : null;
        const href = link?.getAttribute('href');
        if (href == null || staysHere(href)) {
          return;
        }
        event.preventDefault();
        toast.info('Links stay in the showcase: this one opens the app.', {
          id: 'stay-in-showcase',
        });
      }}
    >
      <SampleDataProvider>{children}</SampleDataProvider>
    </div>
  );
}
