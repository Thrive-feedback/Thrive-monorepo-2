import { SiteFooter } from './_components/site-footer';
import { SiteNavbar } from './_components/site-navbar';

/**
 * The main region is a flex column so a page can centre itself in the space between navbar
 * and footer with `m-auto`, without the layout knowing what it holds.
 */
export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col bg-linear-to-b from-backdrop to-backdrop-tint">
      <SiteNavbar />
      <main className="flex flex-1 flex-col px-4 py-12">{children}</main>
      <SiteFooter />
    </div>
  );
}
