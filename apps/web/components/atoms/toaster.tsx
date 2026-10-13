'use client';

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

export type { ToasterProps };

/**
 * Mounted once, in the root layout. Anything then raises a toast with `toast()` from
 * `sonner` — `toast.success('Saved')`, `toast.error(…)` — without a provider or a ref.
 *
 * `unstyled` hands every visual to the classes below, so a toast paints with the status roles
 * like the rest of the app instead of sonner's own palette. Sonner keeps the stacking, the
 * swipe to dismiss and the polite live region that announces each one.
 *
 * Every toast can be closed early. Sonner renders its close button first, so `order-last`
 * moves it to the end of the row, where a close button is looked for.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      closeButton
      icons={{
        success: <CircleCheckIcon className="size-5 text-status-success-fg" />,
        info: <InfoIcon className="size-5 text-status-info-fg" />,
        warning: (
          <TriangleAlertIcon className="size-5 text-status-warning-fg" />
        ),
        error: <OctagonXIcon className="size-5 text-status-error-fg" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
        close: <XIcon aria-hidden="true" className="size-4" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-start gap-3 rounded-control border p-4 text-fg-primary shadow-med',
          title: 'text-subtitle-4',
          description: 'text-body-2 text-fg-secondary',
          // Sonner joins `toast` with the type's classes rather than merging them, so the
          // colour lives only in the type slots: two backgrounds on one element would leave
          // stylesheet order to pick the winner.
          //
          // A toast sits on the near-white card surface, lighter than the page. A status toast
          // lays its status tint over that as an image: two background colours on one element
          // would leave stylesheet order to pick the winner.
          default: 'border-border-default bg-surface-overlay',
          loading: 'border-border-default bg-surface-overlay',
          success:
            'border-status-success-border bg-surface-overlay bg-linear-to-r from-status-success-surface-hover to-status-success-surface-hover',
          info: 'border-status-info-border bg-surface-overlay bg-linear-to-r from-status-info-surface-hover to-status-info-surface-hover',
          warning:
            'border-status-warning-border bg-surface-overlay bg-linear-to-r from-status-warning-surface-hover to-status-warning-surface-hover',
          error:
            'border-status-error-border bg-surface-overlay bg-linear-to-r from-status-error-surface-hover to-status-error-surface-hover',
          actionButton:
            'ms-auto rounded-button bg-action-primary px-3 py-1.5 text-button-sm text-fg-on-action',
          closeButton:
            'order-last ms-auto shrink-0 cursor-pointer rounded-full p-1 text-fg-secondary hover:bg-surface-subtle hover:text-fg-primary',
          cancelButton:
            'rounded-button border border-border-default px-3 py-1.5 text-button-sm',
        },
      }}
      {...props}
    />
  );
}
