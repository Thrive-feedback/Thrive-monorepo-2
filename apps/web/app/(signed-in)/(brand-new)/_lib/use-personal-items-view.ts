import { useSearchParams } from 'next/navigation';
import {
  type BrandNewPersonalView,
  personalViewOf,
} from '@/lib/routes.constant';

/** How Received is laid out right now, as the address says. */
export function usePersonalItemsView(): BrandNewPersonalView {
  return personalViewOf(useSearchParams().get('view'));
}
