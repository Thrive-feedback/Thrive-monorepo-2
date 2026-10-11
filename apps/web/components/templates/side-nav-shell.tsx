import { SiteFooter } from '@/components/molecules/site-footer';
import { SiteSideNav } from '@/components/organisms/site-side-nav';

/**
 * Home's page shape: the side nav beside a column of content and footer. Below `md` the side
 * nav lies flat on top, so the page reads as `SiteShell` does.
 *
 * The main region is a flex column for the same reason as in `SiteShell`: a page can centre
 * itself with `m-auto` without the shell knowing what it holds.
 */
export function SideNavShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-linear-to-b from-surface-base to-surface-subtle md:flex-row">
      <SiteSideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex flex-1 flex-col px-inset-container py-12">
          {children}
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
