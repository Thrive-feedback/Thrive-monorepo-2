'use client';

import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { toast } from 'sonner';
import { MOCK_TEAMMATES } from '@/app/(signed-in)/(member)/home-2/_lib/teammates.mock';
import { Letter, type LetterSide } from '@/components/organisms/letter';
import { SELECTED_PEOPLE } from '@/components/organisms/visibility-picker';
import { cn } from '@/lib/cn.util';
import { ComposeMenu } from './compose-menu';
import styles from './letter-desk.module.css';
import { LetterSendBar, type LetterVisibility } from './letter-send-bar';

const TITLES: Readonly<Record<LetterSide, string>> = {
  feedback: 'Feedback message',
  request: 'Request message',
};

type Draft = {
  recipient: string;
  message: string;
  visibility: LetterVisibility;
  selectedAccountIds: ReadonlySet<string>;
};

const BLANK: Draft = {
  recipient: '',
  message: '',
  visibility: 'ONLY_ME',
  selectedAccountIds: new Set(),
};

function isReady(draft: Draft) {
  return (
    draft.recipient.trim() !== '' &&
    draft.message.trim() !== '' &&
    (draft.visibility !== SELECTED_PEOPLE || draft.selectedAccountIds.size > 0)
  );
}

/**
 * The new Home, as a first look: a letter in the middle of the page, "+" in the top left corner
 * to choose what to write, and who else can read it and Send floating at the foot. It opens on a
 * Feedback message being written. Each kind of letter keeps its own draft.
 *
 * While the Feedback message is written the letter will not turn over; while a Request message
 * is written it turns freely.
 *
 * Nothing is sent or kept yet: Send flies the letter off the page, a toast says it went, and that
 * draft is blank again.
 */
export function LetterDesk() {
  const [writing, setWriting] = useState<LetterSide>('feedback');
  const [isTurnedOver, setIsTurnedOver] = useState(false);
  const [sending, setSending] = useState(false);
  const [drafts, setDrafts] = useState<Record<LetterSide, Draft>>({
    feedback: BLANK,
    request: BLANK,
  });
  const stageRef = useRef<HTMLDivElement>(null);
  const draft = drafts[writing];

  function changeDraft(change: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [writing]: { ...current[writing], ...change },
    }));
  }

  function handleChoose(side: LetterSide) {
    setWriting(side);
    setIsTurnedOver(side === 'request');
  }

  function handleSelectedChange(accountId: string, selected: boolean) {
    const next = new Set(draft.selectedAccountIds);
    if (selected) {
      next.add(accountId);
    } else {
      next.delete(accountId);
    }
    changeDraft({ selectedAccountIds: next });
  }

  // The letter flies off before it is cleared. With reduced motion there is nothing to wait for,
  // so it is cleared at once.
  function handleSend() {
    flushSync(() => setSending(true));
    if ((stageRef.current?.getAnimations?.() ?? []).length === 0) {
      finishSending();
    }
  }

  // Send is disabled once the draft is blank, so the cursor goes back to the top of the letter
  // rather than being lost with it. Only the face being written has fields.
  function finishSending() {
    flushSync(() => {
      changeDraft(BLANK);
      setSending(false);
    });
    toast.success(`${TITLES[writing]} sent.`, {
      description: 'This is a first look: nothing left this page.',
    });
    stageRef.current?.querySelector('input')?.focus();
  }

  function handleStageAnimationEnd(event: React.AnimationEvent) {
    if (event.target === event.currentTarget && sending) {
      finishSending();
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* It takes no height, so the letter centres in the whole page beside it. */}
      <div className="sticky top-22 z-20 h-0 self-start">
        <ComposeMenu writing={writing} onChoose={handleChoose} />
      </div>

      <div className="flex flex-1 items-center justify-center pt-16 pb-10 lg:px-16 lg:pt-10">
        <div
          ref={stageRef}
          className={cn('w-full max-w-2xl', sending && styles.sendAway)}
          onAnimationEnd={handleStageAnimationEnd}
        >
          <Letter
            writing={writing}
            recipient={draft.recipient}
            feedbackMessage={drafts.feedback.message}
            requestMessage={drafts.request.message}
            isTurnedOver={isTurnedOver}
            isTurnLocked={writing === 'feedback'}
            onTurnOver={() => setIsTurnedOver((turned) => !turned)}
            onRecipientChange={(recipient) => changeDraft({ recipient })}
            onFeedbackMessageChange={(message) => changeDraft({ message })}
            onRequestMessageChange={(message) => changeDraft({ message })}
          />
        </div>
      </div>

      {/* Only the bar takes clicks, so the letter either side of it stays reachable. */}
      <div className="pointer-events-none sticky bottom-6 z-20 flex justify-center *:pointer-events-auto">
        <LetterSendBar
          side={writing}
          visibility={draft.visibility}
          people={MOCK_TEAMMATES}
          selectedAccountIds={draft.selectedAccountIds}
          ready={!sending && isReady(draft)}
          onVisibilityChange={(visibility) => changeDraft({ visibility })}
          onSelectedChange={handleSelectedChange}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}
