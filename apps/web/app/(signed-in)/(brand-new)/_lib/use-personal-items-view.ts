import { useSearchParams } from 'next/navigation';
import {
  type BrandNewReceivedView,
  receivedViewOf,
} from '@/lib/routes.constant';

/** How Received is laid out right now, as the address says. */
export function useReceivedView(): BrandNewReceivedView {
  return receivedViewOf(useSearchParams().get('view'));
}
