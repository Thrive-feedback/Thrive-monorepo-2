import { ShowcaseNav } from './_components/showcase-nav';

/** Every showcase page shares one bar, so each is one click from the others. */
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
