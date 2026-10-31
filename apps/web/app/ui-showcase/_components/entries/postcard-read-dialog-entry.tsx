import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { PostcardReadDialogDemo } from './postcard-read-dialog-demo';
import {
  SAMPLE_ANSWERED,
  SAMPLE_ANSWERED_BY_THREE,
  SAMPLE_ANSWERED_LONG_ASK,
  SAMPLE_GIVEN,
  SAMPLE_GIVEN_LONG,
  SAMPLE_GIVEN_TO_SEVERAL,
  SAMPLE_GIVEN_UNSTAMPED,
} from './postcard-samples.mock';

export function PostcardReadDialogEntry() {
  return (
    <ShowcaseEntry
      name="PostcardReadDialog"
      level="organism"
      origin="thrive"
      source="components/organisms/postcard-dialog/postcard-read-dialog.tsx — Dialog + Postcard + PostcardAnswerPager, on the parts PostcardDialog writes with"
      summary="A postcard that has been sent, in front of the page, looking as it did when it was written, with its postmark in the corner and nothing left to change. A button beside Turn over clears the stickers and the postmark away for a moment."
      useFor="Reading Feedback or an answered Feedback Request that was written on a postcard."
      avoidFor="Writing one; use PostcardDialog. A list of Feedback; use FeedbackCard."
      usage={`import { PostcardReadDialog } from '@/components/organisms/postcard-dialog/postcard-read-dialog';

<PostcardReadDialog
  title="Feedback from Ann"
  card={card}
  open={open}
  onOpenChange={setOpen}
/>`}
      props={[
        {
          name: 'title',
          type: 'string',
          description: 'What is being read, above the card.',
        },
        {
          name: 'card',
          type: 'GivenPostcard | AnsweredPostcard',
          description:
            'Which card, by kind. give: one full back, the message under who it is from and who it went to. ask: the back halved, the Ask on the left and one answer on the right, with at least one answer; pass only the answers this reader may read.',
        },
        {
          name: 'initialAnswerIndex',
          type: 'number',
          defaultValue: '0',
          description:
            'Which answer shows as it opens, on a request: the one pressed, on Home.',
        },
        {
          name: 'open / onOpenChange',
          type: 'boolean / (open: boolean) => void',
          description:
            'Whether it is open. Each opening starts on the back at initialAnswerIndex. Close and Escape close it at once, because nothing can be lost.',
        },
      ]}
      accessibility={[
        'The title names the dialog, and focus goes back to whatever opened it.',
        'The side turned away is inert and hidden from screen readers. Turn over is named for the side it turns to.',
        'A message can be reached from the keyboard, so a long one can be scrolled.',
        'The pager says whose answer is showing as it changes. It runs round, so neither button is ever disabled under the cursor.',
        'The postmark is hidden from screen readers, and the day it prints is said in words beside it. On a request it is the day of the answer showing. Hiding the postmark hides those words too.',
      ]}
    >
      <StateCell
        label="Given Feedback"
        hint="One full back, with stickers on both sides and a tag in the message."
      >
        <PostcardReadDialogDemo
          title="Feedback from Ann"
          label="Given to one person"
          card={SAMPLE_GIVEN}
        />
      </StateCell>
      <StateCell
        label="Given to several"
        hint="Their faces fold into one stack, which names them when pressed."
      >
        <PostcardReadDialogDemo
          title="Feedback from Ann"
          label="Given to three people"
          card={SAMPLE_GIVEN_TO_SEVERAL}
        />
      </StateCell>
      <StateCell
        label="No stamp"
        hint="The box printed for a stamp stays, under the postmark."
      >
        <PostcardReadDialogDemo
          title="Feedback from Ann"
          label="Sent with no stamp"
          card={SAMPLE_GIVEN_UNSTAMPED}
        />
      </StateCell>
      <StateCell
        label="A long message"
        hint="It scrolls inside the card, which keeps its size."
      >
        <PostcardReadDialogDemo
          title="Feedback from Ann"
          label="A long message"
          card={SAMPLE_GIVEN_LONG}
        />
      </StateCell>
      <StateCell
        label="An answered request"
        hint="As a Giver reads it: the Ask on the left, their own answer on the right."
      >
        <PostcardReadDialogDemo
          title="Your answer to Mali"
          label="One answer"
          card={SAMPLE_ANSWERED}
        />
      </StateCell>
      <StateCell
        label="A long request"
        hint="It scrolls inside its half, which keeps its size."
      >
        <PostcardReadDialogDemo
          title="Your answer to Mali"
          label="A long request"
          card={SAMPLE_ANSWERED_LONG_ASK}
        />
      </StateCell>
      <StateCell
        label="Several answers"
        hint="As the Requester reads it: the pager swaps the answer and its stickers."
      >
        <PostcardReadDialogDemo
          title="Answers to your request"
          label="Three answers"
          card={SAMPLE_ANSWERED_BY_THREE}
        />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function PostcardReadDialogPreview() {
  return (
    <div className="flex aspect-3/2 w-40 flex-col gap-2 rounded-element border border-border-muted bg-surface-raised p-3 shadow-high">
      <Text variant="body-3" tone="muted" as="span">
        From Ann · To Mali
      </Text>
      <Skeleton />
      <Skeleton className="w-3/4" />
    </div>
  );
}
