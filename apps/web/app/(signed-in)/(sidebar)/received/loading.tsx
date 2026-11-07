import { PersonalItemsHeading } from '@/app/(signed-in)/(sidebar)/_components/personal-items-heading';
import { PersonalItemsLoading } from '@/app/(signed-in)/(sidebar)/_components/personal-items-skeleton';
import { PAGE_COLUMN } from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import { cn } from '@/lib/cn.util';

/**
 * Received while the server builds it. The navbar and sidebar stay in place, and the heading is
 * known already, so only the cards wait, in grey, and nothing jumps when they arrive. A loading file
 * cannot read the address, so it holds the view Received opens on.
 */
export default function ReceivedLoading() {
  return (
    <div className={cn(PAGE_COLUMN, 'flex flex-col gap-6')}>
      <PersonalItemsHeading side="received" />
      <PersonalItemsLoading view="grid" />
    </div>
  );
}
