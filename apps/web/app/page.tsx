/**
 * The landing route. Deliberately empty of product: `GEN_03` R5 requires the web app to
 * render its own page once the example is gone, and `PROJECT.md` §2 says to solve today's
 * problem rather than the general case. The first real route replaces this.
 */
export default function Home() {
  return (
    <main>
      <h1>Thrive</h1>
      <p>Ask for, give and act on feedback.</p>
    </main>
  );
}
