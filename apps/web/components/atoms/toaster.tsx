'use client';

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
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
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      icons={{
        success: <CircleCheckIcon className="size-5 text-success" />,
        info: <InfoIcon className="size-5 text-info" />,
        warning: <TriangleAlertIcon className="size-5 text-caution" />,
        error: <OctagonXIcon className="size-5 text-danger" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-start gap-3 rounded-control border p-4 text-foreground shadow-floating',
          title: 'text-subtitle4',
          description: 'text-body2 text-foreground-muted',
          // Sonner joins `toast` with the type's classes rather than merging them, so the
          // colour lives only in the type slots: two backgrounds on one element would leave
          // stylesheet order to pick the winner.
          default: 'border-line bg-surface',
          loading: 'border-line bg-surface',
          success: 'border-success bg-success-subtle',
          info: 'border-info bg-info-subtle',
          warning: 'border-caution bg-caution-subtle',
          error: 'border-danger bg-danger-subtle',
          actionButton:
            'ms-auto rounded-control bg-action px-3 py-1.5 text-button-medium text-foreground-on-action',
          cancelButton:
            'rounded-control border border-line px-3 py-1.5 text-button-medium',
        },
      }}
      {...props}
    />
  );
}
