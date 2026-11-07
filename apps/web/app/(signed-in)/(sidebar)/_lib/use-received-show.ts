import { useSearchParams } from 'next/navigation';
import {
  type BrandNewReceivedShow,
  receivedShowOf,
} from '@/lib/routes.constant';

/** What Received is narrowed to right now, as the address says; Given is never narrowed. */
export function useReceivedShow(): BrandNewReceivedShow {
  return receivedShowOf(useSearchParams().get('show'));
}
