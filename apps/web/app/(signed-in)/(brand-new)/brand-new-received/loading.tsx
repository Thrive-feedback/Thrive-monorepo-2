import { BRAND_NEW_COLUMN } from '@/app/(signed-in)/(brand-new)/_lib/brand-new-column.constant';
import { cn } from '@/lib/cn.util';
import { ReceivedHeading } from './_components/received-heading';
import { ReceivedItemsLoading } from './_components/received-items';

/**
 * Received while the server builds it. The navbar and sidebar stay in place, and the heading is
 * known already, so only the cards wait, in grey, and nothing jumps when they arrive. A loading file
 * cannot read the address, so it holds the view Received opens on.
 */
export default function BrandNewReceivedLoading() {
  return (
    <div className={cn(BRAND_NEW_COLUMN, 'flex flex-col gap-6')}>
      <ReceivedHeading />
      <ReceivedItemsLoading view="grid" />
    </div>
  );
}
