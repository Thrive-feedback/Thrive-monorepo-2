import { BrandNewPageTitle } from '@/app/(signed-in)/(brand-new)/_components/brand-new-page-title';
import { BRAND_NEW_COLUMN } from '@/app/(signed-in)/(brand-new)/_lib/brand-new-column.constant';

/** The Kudos board while the server builds it, which is the title and nothing yet under it. */
export default function BrandNewKudosLoading() {
  return (
    <div className={BRAND_NEW_COLUMN}>
      <BrandNewPageTitle>Kudos board</BrandNewPageTitle>
    </div>
  );
}
