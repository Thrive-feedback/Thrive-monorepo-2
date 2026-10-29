import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { PostcardDialogDemo } from './postcard-dialog-demo';

export function PostcardDialogEntry() {
  return (
    <ShowcaseEntry
      name="PostcardDialog"
      level="organism"
      origin="thrive"
      source="components/organisms/postcard-dialog/postcard-dialog.tsx — Dialog + MemberMultiPicker + VisibilityMenu + DropdownMenu on a card that turns over"
      summary="Feedback written on a landscape postcard in front of the page: the message on the back under who it is from and who it is for, a picture on the front, and a bar of tools beside Seal & Send that holds the text's tools while the message is written."
      useFor="Giving Feedback from anywhere: Home's + menu, a Member's page with them already chosen, a reply to something in the Feed."
      avoidFor="Reading Feedback that was sent; use FeedbackCard. Kudos, which has its own small card."
      usage={`import { PostcardDialog } from '@/components/organisms/postcard-dialog/postcard-dialog';

<PostcardDialog
  title="Give feedback"
  teammates={teammates}
  writer={{ name: profile.displayName, photoUrl }}
  defaultRecipientAccountIds={[member.accountId]}
  open={open}
  onOpenChange={setOpen}
  onSend={(postcard) => giveFeedback(postcard)}
/>`}
      props={[
        {
          name: 'kind',
          type: "'give' | 'ask' | 'answer'",
          defaultValue: "'give'",
          description:
            'Which card. give: one full back. ask: the back halved, the Request message written on the left under From and To, the right left for the answers. answer: the Ask read-only on the left, the answer written on the right.',
        },
        {
          name: 'ask',
          type: '{ requester, message, tone, textStyle }',
          description:
            'answer only: the Ask being answered, as its Requester wrote it. The answer is written on its paper.',
        },
        {
          name: 'title',
          type: 'string',
          description: 'What is being written, above the card.',
        },
        {
          name: 'teammates',
          type: 'Teammate[]',
          description:
            'Who it can be for, and who else can be chosen to read it: the Workspace but the writer.',
        },
        {
          name: 'writer',
          type: '{ name: string; photoUrl: string | null }',
          description: 'Who signs it, after "From".',
        },
        {
          name: 'defaultRecipientAccountIds',
          type: 'string[]',
          defaultValue: '[]',
          description:
            'Who it is for as it opens. Read at each opening; the card owns it from then on.',
        },
        {
          name: 'open / onOpenChange',
          type: 'boolean / (open: boolean) => void',
          description:
            'Whether it is open. Each opening is a blank card. It closes itself after Seal & Send and after a confirmed Close.',
        },
        {
          name: 'onSend',
          type: '(postcard: PostcardDraft) => void · answer: (answer: PostcardAnswer) => void',
          description:
            'Send was pressed, handed over at the press: give and ask hand over who it is for (or who is asked), the message, who else can read it, the paper and the text style; answer hands over the answer and its style. The dialog sends nothing itself, and closes itself once the card has flown off.',
        },
        {
          name: 'onCloseAutoFocus',
          type: '(event: Event) => void',
          description:
            'Closed. Focus goes back to whatever had it when the card opened; prevent the default to send it somewhere else, as when that control has gone, like an item in a menu that has closed.',
        },
      ]}
      accessibility={[
        'The title names the dialog. Focus starts on "To" while nobody is chosen, and on the message once somebody is.',
        'The side turned away is inert and hidden from screen readers. Turn over is named for the side it turns to.',
        'The bar is a group named for what it holds: Postcard tools, or Text style while the message is written. Escape first leaves the text tools, then asks before closing; Close always asks.',
        'Paper Tone, Visibility, the font and the ink say their current choice to a screen reader even where the screen shows only a swatch.',
        'With reduced motion the card turns and flies off at once.',
      ]}
    >
      <StateCell
        label="Ask for feedback"
        hint="The back halved: the request on the left, the right left for the answers."
      >
        <PostcardDialogDemo kind="ask" title="Ask for feedback" />
      </StateCell>
      <StateCell
        label="Answer an Ask"
        hint="Mali's request read-only on the left, the answer written on the right."
      >
        <PostcardDialogDemo kind="answer" title="Answer" />
      </StateCell>
      <StateCell label="Give feedback" hint="A blank card on its back.">
        <PostcardDialogDemo title="Give feedback" />
      </StateCell>
      <StateCell
        label="Opened for someone"
        hint="As from a Member's page: who it is for is already chosen."
      >
        <PostcardDialogDemo
          title="Give feedback to Mali"
          defaultRecipientAccountIds={['mali']}
        />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function PostcardDialogPreview() {
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
