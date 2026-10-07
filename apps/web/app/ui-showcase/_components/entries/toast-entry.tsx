import { CircleCheckIcon } from 'lucide-react';
import { ToastDemo } from '@/app/ui-showcase/_components/entries/toast-demo';
import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';

export function ToastEntry() {
  return (
    <ShowcaseEntry
      name="Toast"
      level="atom"
      origin="shadcn"
      source="components/atoms/toaster.tsx (Toaster, mounted in app/layout.tsx) + toast() from sonner"
      summary="A short message about something that just happened, which goes away on its own."
      useFor="Confirming an action: saved, sent, copied. Undo."
      avoidFor="Errors the person must fix (put them by the field) or anything they must not miss."
      usage={`import { toast } from 'sonner';

toast.success('Resend success!', {
  description: 'We have sent the verification link to tony@stark.com',
});
toast.error('Could not send');
toast('Feedback archived', { action: { label: 'Undo', onClick: restore } });`}
      props={[
        {
          name: 'toast(message, options)',
          type: 'toast | .success | .error | .warning | .info | .promise',
          description: 'Raise one from any client code. No provider or hook.',
        },
        {
          name: 'options.description',
          type: 'ReactNode',
          description: 'A second line under the title.',
        },
        {
          name: 'options.action',
          type: '{ label, onClick }',
          description: 'One button, for Undo or View.',
        },
        {
          name: 'options.duration',
          type: 'number',
          defaultValue: '4000',
          description: 'Milliseconds before it closes.',
        },
        {
          name: '<Toaster position>',
          type: "'bottom-right' | 'top-center' | …",
          defaultValue: "'bottom-right'",
          description: 'Set once, in the root layout.',
        },
      ]}
      accessibility={[
        'Announced politely by a live region; it does not take focus.',
        'Hovering or focusing pauses the timer; it can be swiped away.',
      ]}
    >
      <StateCell label="Try each kind" hint="Toasts appear bottom right">
        <ToastDemo />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function ToastPreview() {
  return (
    <div className="flex w-full items-start gap-3 rounded-element border border-status-success-border bg-status-success-surface p-3">
      <CircleCheckIcon
        aria-hidden="true"
        className="size-5 text-status-success-fg"
      />
      <div className="flex flex-col text-body-2">
        <span className="font-medium">Resend success!</span>
        <span className="text-fg-secondary">Verification link sent.</span>
      </div>
    </div>
  );
}
