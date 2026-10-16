'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';
import type { NavTarget } from '@/lib/navigation/nav-target.type';

export type HomeDialogProps = {
  title: string;
  /**
   * Where closing goes. On Home, the address without the dialog's search param, so closing it
   * leaves the tab as it was; elsewhere, a callback that closes it in place.
   */
  close: NavTarget;
  children: React.ReactNode;
};

/**
 * A Feedback Request or Ask open over Home. On Home its id is in the address, so the dialog is
 * open whenever the page draws it; closing it — the ×, Escape or the scrim — drops the id from
 * the address, so a reload afterwards does not bring it back. It closes at once rather than
 * waiting for the navigation to finish.
 */
export function HomeDialog({ title, close, children }: HomeDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  function handleOpenChange(open: boolean) {
    if (open) {
      return;
    }
    setIsOpen(false);
    if ('href' in close) {
      router.replace(close.href, { scroll: false });
    } else {
      close.onSelect();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-150" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
