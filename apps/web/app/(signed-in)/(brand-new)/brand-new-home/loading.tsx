import { HomeFeedSkeleton } from './_components/home-feed';

/**
 * The new Home while the server builds it. The navbar and sidebar stay in place, so this holds the
 * feed's column in grey.
 */
export default function BrandNewHomeLoading() {
  return (
    <div className="mx-auto w-full max-w-180 px-4 py-8">
      <HomeFeedSkeleton />
    </div>
  );
}
