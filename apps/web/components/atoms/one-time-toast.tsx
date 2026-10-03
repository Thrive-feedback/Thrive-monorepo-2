'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

export type OneTimeToastProps = {
  type: 'success' | 'error';
  message: string;
  /** The same address without the query that asked for the toast. */
  then: string;
};

/**
 * Raises a toast once when a page is reached with a query that asks for one — a finished or
 * failed sign-in — then drops that query from the address, so a refresh doesn't raise it
 * again. The message is the toast's `id`, so a double effect run never stacks two. Renders
 * nothing itself.
 */
export function OneTimeToast({ type, message, then }: OneTimeToastProps) {
  const router = useRouter();

  useEffect(() => {
    toast[type](message, { id: message });
    router.replace(then, { scroll: false });
  }, [type, message, then, router]);

  return null;
}
