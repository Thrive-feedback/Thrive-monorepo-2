import { ShowcaseNav } from './_components/showcase-nav';

/** The two showcase pages share one bar, so each is one click from the other. */
export default function UiShowcaseLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ShowcaseNav />
      {children}
    </>
  );
}
