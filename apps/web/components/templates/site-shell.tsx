import { OrbBackdrop } from '@/components/atoms/orb-backdrop';
import { SiteNavbar } from '@/components/organisms/site-navbar';

export type SiteShellProps = {
  children: React.ReactNode;
  /** The navbar across the top. The sign-in page leaves it out and stands on its own. */
  hasNavbar?: boolean;
};

/**
 * The page shape every signed-out and signed-in screen shares: navbar, then content, over the
 * landing page's ground of drifting orbs, so the way in looks like the page that led to it.
 *
 * The main region is a flex column so a page can centre itself in the space below the navbar
 * with `m-auto`, without the shell knowing what it holds. Its side padding steps up with the
 * navbar's, so page content lines up with the logo at every width.
 */
export function SiteShell({ children, hasNavbar = true }: SiteShellProps) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-surface-base">
      <OrbBackdrop spread="screen" />
      {hasNavbar && <SiteNavbar />}
      <main className="flex flex-1 flex-col px-inset-container py-12">
        {children}
      </main>
    </div>
  );
}
