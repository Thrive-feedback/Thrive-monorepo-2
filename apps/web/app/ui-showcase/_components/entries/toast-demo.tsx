'use client';

import { toast } from 'sonner';
import { Button } from '@/components/atoms/button';

/** Client-only because raising a toast is an event handler; the Toaster itself is in the root layout. */
export function ToastDemo() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button
        size="sm"
        onClick={() =>
          toast.success('Resend success!', {
            description: 'We have sent the verification link to tony@stark.com',
          })
        }
      >
        Success
      </Button>
      <Button
        size="sm"
        onClick={() =>
          toast.error('Could not send', {
            description: 'Check your connection and try again.',
          })
        }
      >
        Error
      </Button>
      <Button
        size="sm"
        onClick={() =>
          toast.warning('Almost full', {
            description: 'Your Workspace has 2 seats left.',
          })
        }
      >
        Warning
      </Button>
      <Button
        size="sm"
        onClick={() =>
          toast.info('New feedback', { description: 'P’Mod sent you a Kudo.' })
        }
      >
        Info
      </Button>
      <Button
        size="sm"
        onClick={() =>
          toast('Feedback archived', {
            action: { label: 'Undo', onClick: () => toast('Restored') },
          })
        }
      >
        With action
      </Button>
      <Button
        size="sm"
        onClick={() =>
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
            loading: 'Saving…',
            success: 'Saved',
            error: 'Could not save',
          })
        }
      >
        Promise
      </Button>
    </div>
  );
}
