'use client';

import { useState } from 'react';
import { LETTER_TEAMMATES } from '@/app/ui-showcase/letter/_components/letter-teammates.mock';
import { Letter, type LetterSide } from '@/components/organisms/letter';

export type LetterSheetDemoProps = {
  writing: LetterSide | null;
  recipientAccountIds?: readonly string[];
  feedbackMessage?: string;
  requestMessage?: string;
  isTurnedOver?: boolean;
};

/**
 * Client-only because the letter holds what is typed and which face is up in state. The Feedback
 * message cannot be turned away from while it is written, as on Home. The padding on a wide screen
 * is where Turn over sits, beside the letter.
 */
export function LetterSheetDemo({
  writing,
  recipientAccountIds: initialRecipients = [],
  feedbackMessage: initialFeedback = '',
  requestMessage: initialRequest = '',
  isTurnedOver: initiallyTurnedOver = false,
}: LetterSheetDemoProps) {
  const [recipientAccountIds, setRecipientAccountIds] =
    useState(initialRecipients);
  const [feedbackMessage, setFeedbackMessage] = useState(initialFeedback);
  const [requestMessage, setRequestMessage] = useState(initialRequest);
  const [isTurnedOver, setIsTurnedOver] = useState(initiallyTurnedOver);

  return (
    <div className="w-full max-w-2xl lg:pr-16">
      <Letter
        writing={writing}
        teammates={LETTER_TEAMMATES}
        recipientAccountIds={recipientAccountIds}
        feedbackMessage={feedbackMessage}
        requestMessage={requestMessage}
        isTurnedOver={isTurnedOver}
        isTurnLocked={writing === 'feedback'}
        onTurnOver={() => setIsTurnedOver((turned) => !turned)}
        onRecipientsChange={setRecipientAccountIds}
        onFeedbackMessageChange={setFeedbackMessage}
        onRequestMessageChange={setRequestMessage}
      />
    </div>
  );
}
