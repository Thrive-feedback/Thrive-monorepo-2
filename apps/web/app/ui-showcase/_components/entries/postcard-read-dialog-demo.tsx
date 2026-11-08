'use client';

import { useState } from 'react';
import { Button } from '@/components/atoms/button';
import type { PostcardWriter } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { ReadPostcard } from '@/components/organisms/postcard-dialog/postcard-read.type';
import { PostcardReadDialog } from '@/components/organisms/postcard-dialog/postcard-read-dialog';

export type PostcardReadDialogDemoProps = {
  /** The dialog's title. */
  title: string;
  /** Whoever the title names. */
  person?: PostcardWriter;
  /** What the button opening it says. */
  label: string;
  card: ReadPostcard;
};

/** Client-only because the dialog is opened from a button here. */
export function PostcardReadDialogDemo({
  title,
  person,
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
        person={person}
        card={card}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
