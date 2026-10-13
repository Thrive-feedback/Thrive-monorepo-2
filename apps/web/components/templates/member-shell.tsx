import { SiteFooter } from '@/components/molecules/site-footer';
import { MemberNavbar } from '@/components/organisms/member-navbar';

/**
 * The page shape of every page a Member uses: the Member navbar, content, footer. It is
 * `SiteShell` with the navbar that has Home and the account menu.
 *
 * The main region is a flex column so a page can centre itself with `m-auto` without the
 * shell knowing what it holds.
 */
export function MemberShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-linear-to-b from-surface-base to-surface-subtle">
      <MemberNavbar />
      <main className="flex flex-1 flex-col px-inset-container py-12">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
