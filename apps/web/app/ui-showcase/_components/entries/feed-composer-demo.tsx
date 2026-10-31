'use client';

import { useState } from 'react';
import { FeedComposer } from '@/components/organisms/feed-composer';
import type { Teammate } from '@/lib/feedback/teammate.type';

const TEAMMATES: readonly Teammate[] = [
  {
    accountId: 'mali',
    name: 'Mali Sombat',
    displayName: 'Mali',
    email: 'mali@acme.test',
    photoUrl: null,
    slug: 'mali',
  },
  {
    accountId: 'ben',
    name: 'Ben Carter',
    displayName: 'Ben',
    email: 'ben@acme.test',
    photoUrl: null,
    slug: 'ben',
  },
];

const WRITER = { name: 'Dao Prasert', photoUrl: null };

export type FeedComposerDemoProps = {
  /** What is typed as it is drawn. */
  initialMessage?: string;
};

/** A working composer with nowhere to send: its choices only stay on the page. */
export function FeedComposerDemo({
  initialMessage = '',
}: FeedComposerDemoProps) {
  const [message, setMessage] = useState(initialMessage);

  return (
    <div className="w-full max-w-180">
      <FeedComposer
        writer={WRITER}
        teammates={TEAMMATES}
        workspaceGoals={['Ownership', 'Customer first']}
        message={message}
        onMessageChange={setMessage}
        onChoose={() => {}}
      />
    </div>
  );
}
