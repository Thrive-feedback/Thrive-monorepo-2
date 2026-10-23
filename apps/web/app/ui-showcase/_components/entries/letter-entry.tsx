import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { LetterSheetDemo } from './letter-sheet-demo';

export function LetterEntry() {
  return (
    <ShowcaseEntry
      name="Letter"
      level="organism"
      origin="thrive"
      source="components/organisms/letter.tsx — Input + Textarea + Text on a sheet that turns over"
      summary="Feedback as a letter: one sheet with the Feedback message on the front and the Request message on the back, and Turn over beside it. Only the face being written can be typed on."
      useFor="Writing or reading a Feedback message or a Request message as a letter, as on Home."
      avoidFor="A message in a list or a card; use FeedbackCard. A form with more fields than who it is for and what it says."
      usage={`import { Letter } from '@/components/organisms/letter';

<Letter
  writing="feedback"
  recipient={recipient}
  feedbackMessage={feedbackMessage}
  requestMessage={requestMessage}
  isTurnedOver={isTurnedOver}
  isTurnLocked
  onTurnOver={() => setIsTurnedOver((turned) => !turned)}
  onRecipientChange={setRecipient}
  onFeedbackMessageChange={setFeedbackMessage}
  onRequestMessageChange={setRequestMessage}
/>`}
      props={[
        {
          name: 'writing',
          type: "'feedback' | 'request' | null",
          description:
            'The face that can be typed on. null, and both faces only show what is written. A change moves the cursor to "Dear", or to the message if who it is for is filled in.',
        },
        {
          name: 'recipient',
          type: 'string',
          description: 'Who the letter being written is for, after "Dear".',
        },
        {
          name: 'feedbackMessage',
          type: 'string',
          description: 'What is written on the front.',
        },
        {
          name: 'requestMessage',
          type: 'string',
          description: 'What is written on the back.',
        },
        {
          name: 'isTurnedOver',
          type: 'boolean',
          description:
            'The Request message faces the reader rather than the Feedback message.',
        },
        {
          name: 'isTurnLocked',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Turn over shakes the letter instead of calling onTurnOver, and a lock replaces its icon.',
        },
        {
          name: 'onTurnOver',
          type: '() => void',
          description:
            'Turn over was pressed while the letter is free to turn.',
        },
        {
          name: 'onRecipientChange',
          type: '(value: string) => void',
          description: 'Pairs with recipient.',
        },
        {
          name: 'onFeedbackMessageChange',
          type: '(value: string) => void',
          description: 'Pairs with feedbackMessage.',
        },
        {
          name: 'onRequestMessageChange',
          type: '(value: string) => void',
          description: 'Pairs with requestMessage.',
        },
      ]}
      accessibility={[
        'Each face is a section headed by its title; the face turned away is inert and hidden from a screen reader.',
        'Turn over is named for the face it turns to. Locked, it is aria-disabled rather than disabled, so it can still be reached, and a polite live region says why it will not turn.',
        '"Dear" labels who it is for; the message field has a label for screen readers only.',
        'With reduced motion the sheet turns at once and does not shake.',
      ]}
    >
      <StateCell
        label="Writing the Feedback message"
        hint="Turn over shakes: the letter stays on the face being written."
        wide
      >
        <LetterSheetDemo writing="feedback" />
      </StateCell>
      <StateCell
        label="Writing the Request message"
        hint="Turn over to see the front left for the people asked."
        wide
      >
        <LetterSheetDemo
          writing="request"
          isTurnedOver
          recipient="Mali"
          requestMessage="How did my kickoff land?"
        />
      </StateCell>
      <StateCell label="Read only" wide>
        <LetterSheetDemo
          writing={null}
          feedbackMessage={
            'The kickoff deck was clear and short.\nThe timeline slide answered every question before it was asked.'
          }
          requestMessage="How did my kickoff land?"
        />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function LetterPreview() {
  return (
    <div className="flex w-40 flex-col gap-2 rounded-control border border-border-muted bg-surface-raised p-3 shadow-high">
      <Text variant="subtitle-display-4" as="span">
        Feedback message
      </Text>
      <Skeleton />
      <Skeleton className="w-3/4" />
      <Text variant="subtitle-handwrite-4" as="span" className="self-end">
        — You
      </Text>
    </div>
  );
}
