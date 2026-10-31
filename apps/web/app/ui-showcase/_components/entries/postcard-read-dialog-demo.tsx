'use client';

import { useState } from 'react';
import { Button } from '@/components/atoms/button';
import type { ReadPostcard } from '@/components/organisms/postcard-dialog/postcard-read.type';
import { PostcardReadDialog } from '@/components/organisms/postcard-dialog/postcard-read-dialog';

export type PostcardReadDialogDemoProps = {
  /** The dialog's title. */
  title: string;
  /** What the button opening it says. */
  label: string;
  card: ReadPostcard;
};

/** Client-only because the dialog is opened from a button here. */
export function PostcardReadDialogDemo({
  title,
  label,
  card,
}: PostcardReadDialogDemoProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <PostcardReadDialog
        title={title}
        card={card}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
