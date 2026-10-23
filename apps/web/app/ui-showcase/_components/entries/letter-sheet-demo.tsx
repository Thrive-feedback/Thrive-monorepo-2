'use client';

import { useState } from 'react';
import { Letter, type LetterSide } from '@/components/organisms/letter';

export type LetterSheetDemoProps = {
  writing: LetterSide | null;
  recipient?: string;
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
  recipient: initialRecipient = '',
  feedbackMessage: initialFeedback = '',
  requestMessage: initialRequest = '',
  isTurnedOver: initiallyTurnedOver = false,
}: LetterSheetDemoProps) {
  const [recipient, setRecipient] = useState(initialRecipient);
  const [feedbackMessage, setFeedbackMessage] = useState(initialFeedback);
  const [requestMessage, setRequestMessage] = useState(initialRequest);
  const [isTurnedOver, setIsTurnedOver] = useState(initiallyTurnedOver);

  return (
    <div className="w-full max-w-2xl lg:pr-16">
      <Letter
        writing={writing}
        recipient={recipient}
        feedbackMessage={feedbackMessage}
        requestMessage={requestMessage}
        isTurnedOver={isTurnedOver}
        isTurnLocked={writing === 'feedback'}
        onTurnOver={() => setIsTurnedOver((turned) => !turned)}
        onRecipientChange={setRecipient}
        onFeedbackMessageChange={setFeedbackMessage}
        onRequestMessageChange={setRequestMessage}
      />
    </div>
  );
}
