import { SiteFooter } from '@/components/molecules/site-footer';
import { SiteNavbar } from '@/components/organisms/site-navbar';

/**
 * The page shape every signed-out and signed-in screen shares: navbar, content, footer.
 *
 * The main region is a flex column so a page can centre itself in the space between navbar
 * and footer with `m-auto`, without the shell knowing what it holds. Its side padding steps up
 * with the navbar's and footer's, so page content lines up with the logo at every width.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-linear-to-b from-backdrop to-backdrop-tint">
      <SiteNavbar />
      <main className="flex flex-1 flex-col px-4 py-12 md:px-10">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
