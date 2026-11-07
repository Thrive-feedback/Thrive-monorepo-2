import { unstable_rethrow } from 'next/navigation';
import { toast } from 'sonner';
import type { SendPostcardResult } from './sent-postcard.type';

/**
 * Sends a card and says how it went. Whether it went decides what the card does next: a card that
 * went leaves, and one that did not stays open with everything on it.
 */
export async function deliverCard(
  send: () => Promise<SendPostcardResult>,
  sent: string,
  couldNotSend: string,
): Promise<boolean> {
  try {
    const { formError } = await send();
    if (formError) {
      toast.error(formError);
      return false;
    }
  } catch (error) {
    // Being signed out rejects the action with a redirect, which is not a send that failed.
    unstable_rethrow(error);
    toast.error(couldNotSend);
    return false;
  }
  toast.success(sent);
  return true;
}
