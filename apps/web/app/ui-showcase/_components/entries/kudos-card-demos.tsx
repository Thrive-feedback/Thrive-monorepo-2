'use client';

import { useState } from 'react';
import { Button } from '@/components/atoms/button';
import { KudosFeedCard } from '@/components/organisms/feed-card/kudos-feed-card';
import { kudosCardDate } from '@/components/organisms/kudos-dialog/kudos-card.util';
import { KudosCardReadDialog } from '@/components/organisms/kudos-dialog/kudos-card-read-dialog';
import { KudosCardReadOnly } from '@/components/organisms/kudos-dialog/kudos-card-read-only';
import type { ReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.type';
import { SAMPLE_READER } from './feed-card-samples.constant';

export type KudosCardDemoProps = {
  kudos: ReadKudos;
  /** Which side shows. */
  side?: 'front' | 'back';
};

/** Client-only because a sent card holds which way up it is. */
export function KudosCardDemo({ kudos, side }: KudosCardDemoProps) {
  return (
    <KudosCardReadOnly
      message={kudos.message}
      tags={kudos.messageTags}
      drawing={kudos.drawing}
      date={kudosCardDate(kudos.givenAt)}
      side={side}
    />
  );
}

export type KudosFeedCardDemoProps = {
  kudos: ReadKudos;
};

/** Client-only because the card holds whether its dialog is open. */
export function KudosFeedCardDemo({ kudos }: KudosFeedCardDemoProps) {
  return <KudosFeedCard kudos={kudos} readerAccountId={SAMPLE_READER} />;
}

export type KudosCardReadDialogDemoProps = {
  kudos: ReadKudos;
  /** What the button opening it says. */
  label: string;
};

/** Client-only because the dialog is opened from a button here. */
export function KudosCardReadDialogDemo({
  kudos,
  label,
}: KudosCardReadDialogDemoProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <KudosCardReadDialog kudos={kudos} open={open} onOpenChange={setOpen} />
    </>
  );
}
