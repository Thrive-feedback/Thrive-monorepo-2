import { useSearchParams } from 'next/navigation';
import { type ReceivedShow, receivedShowOf } from '@/lib/routes.constant';

/** What Received is narrowed to right now, as the address says; Given is never narrowed. */
export function useReceivedShow(): ReceivedShow {
  return receivedShowOf(useSearchParams().get('show'));
}
