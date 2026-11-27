import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import type { OneOnOneActionResult } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';

export type RunOptions = {
  /** Said once it went; nothing is said when it is left out. */
  readonly done?: string;
  /** What to do once it went, such as closing a dialog. */
  readonly onSuccess?: (result: OneOnOneActionResult) => void;
  /** What to do when it was refused, such as forgetting where focus was to go. */
  readonly onRefused?: () => void;
};

/**
 * Runs one write to a 1:1 or its meetings, the same way everywhere: a refusal is said and the page
 * is read again, as what was refused may be out of date; what went is said when there are words for
 * it. A write that went has read the page again on the server already, so it is not read twice.
 */
export function useOneOnOneAction() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(
    action: () => Promise<OneOnOneActionResult>,
    { done, onSuccess, onRefused }: RunOptions = {},
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.message);
        onRefused?.();
        router.refresh();
        return;
      }
      if (done) {
        toast.success(done);
      }
      onSuccess?.(result);
    });
  }

  return { isPending, run };
}
