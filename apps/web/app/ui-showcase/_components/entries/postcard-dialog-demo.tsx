'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { LETTER_TEAMMATES } from '@/app/ui-showcase/letter/_components/letter-teammates.mock';
import { Button } from '@/components/atoms/button';
import { PostcardDialog } from '@/components/organisms/postcard-dialog/postcard-dialog';
import type { PostcardAsk } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';

const WRITER = { name: 'Ann', photoUrl: null };

/** A made-up Ask from Mali: the showcase reaches no Workspace. */
const SAMPLE_ASK: PostcardAsk = {
  requester: { name: 'Mali Sombat', photoUrl: null },
  message:
    'How did the demo land for you?\nI rushed the pricing slide — was it still clear what each plan includes?',
  tone: 'sage',
  textStyle: { ...DEFAULT_TEXT_STYLE, font: 'classic' },
};

export type PostcardDialogDemoProps = {
  /** What the button opening it says, which is also the dialog's title. */
  title: string;
  kind?: 'give' | 'ask' | 'answer';
  defaultRecipientAccountIds?: readonly string[];
};

/**
 * Client-only because the dialog is opened from a button here. Send only says what would have
 * been sent: the showcase reaches no Workspace.
 */
export function PostcardDialogDemo({
  title,
  kind = 'give',
  defaultRecipientAccountIds,
}: PostcardDialogDemoProps) {
  const [open, setOpen] = useState(false);
  const common = { title, writer: WRITER, open, onOpenChange: setOpen };

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        {title}
      </Button>
      {kind === 'answer' ? (
        <PostcardDialog
          {...common}
          kind="answer"
          ask={SAMPLE_ASK}
          onSend={(answer) =>
            toast.success('Send answer pressed.', {
              description: `${answer.message.length} characters, in ${answer.textStyle.font}.`,
            })
          }
        />
      ) : (
        <PostcardDialog
          {...common}
          kind={kind}
          teammates={LETTER_TEAMMATES}
          defaultRecipientAccountIds={defaultRecipientAccountIds}
          onSend={(postcard) =>
            toast.success('Send pressed.', {
              description: `For ${postcard.recipientAccountIds.length} ${postcard.recipientAccountIds.length === 1 ? 'person' : 'people'}, ${postcard.message.length} characters, on ${postcard.tone} paper.`,
            })
          }
        />
      )}
    </>
  );
}
