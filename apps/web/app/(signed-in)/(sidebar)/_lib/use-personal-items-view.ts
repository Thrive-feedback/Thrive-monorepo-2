import { useSearchParams } from 'next/navigation';
import { type PersonalView, personalViewOf } from '@/lib/routes.constant';

/** How Received or Given is laid out right now, as the address says. */
export function usePersonalItemsView(): PersonalView {
  return personalViewOf(useSearchParams().get('view'));
}
