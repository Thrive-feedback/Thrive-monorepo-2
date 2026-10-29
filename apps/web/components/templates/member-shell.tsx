import { preconnect } from 'react-dom';
import styles from '@/components/organisms/glass.module.css';
import { MemberNavbar } from '@/components/organisms/member-navbar';
import { cn } from '@/lib/cn.util';

/** Where Google serves the photos people signed in with. */
const GOOGLE_PHOTOS_ORIGIN = 'https://lh3.googleusercontent.com';

/**
 * The page shape of every page a Member uses: the Member navbar, then content. It is
 * `SiteShell` with the navbar that has Settings and the account avatar, inside a frame of frosted
 * glass: the navbar across the top and a strip down each side and along the bottom, all fixed
 * to the window with the same tint and blur. The page scrolls underneath, as if through a
 * rounded window. The strips are decoration, hidden from screen readers and from the pointer.
 *
 * The navbar is fixed rather than sticky, like the strips, so the frame stays in one piece when
 * the page bounces past its ends on a trackpad; the main region starts below it.
 *
 * The main region holds a flex column so a page can centre itself with `m-auto` without the
 * shell knowing what it holds.
 */
export function MemberShell({
  navbar = <MemberNavbar />,
  children,
}: {
  /** The bar across the top; the new Home brings its own while it is built beside the old one. */
  navbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  // Every signed-in page shows faces, so the connection to Google is opened while the page
  // renders rather than when the first photo is asked for.
  preconnect(GOOGLE_PHOTOS_ORIGIN);
  return (
    <div className="flex min-h-dvh flex-col">
      {navbar}
      {/* The strips lie over the page, so the inset is measured from inside them: the outer
          padding is a strip's width, the inner one the container's inset. Otherwise, on a
          phone, the content would come within a few pixels of the frame. */}
      <main className="mt-18 flex flex-1 flex-col px-3 py-12">
        <div className="flex flex-1 flex-col px-inset-container">
          {children}
        </div>
      </main>
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none fixed top-18 bottom-3 left-0 z-30 w-3',
          styles.glass,
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none fixed top-18 right-0 bottom-3 z-30 w-3',
          styles.glass,
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none fixed inset-x-0 bottom-0 z-30 h-3',
          styles.glass,
          styles.curvesUp,
          styles.framed,
        )}
      />
    </div>
  );
}
