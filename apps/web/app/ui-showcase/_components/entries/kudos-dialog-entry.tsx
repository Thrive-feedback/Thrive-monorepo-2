import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { KudosCardFace } from '@/components/organisms/kudos-dialog/kudos-card-face';
import { KUDOS_TEMPLATE_KEYS } from '@/components/organisms/kudos-dialog/kudos-template.constant';
import { KudosDialogDemo } from './kudos-dialog-demo';

export function KudosDialogEntry() {
  return (
    <ShowcaseEntry
      name="KudosDialog"
      level="organism"
      origin="thrive"
      source="components/organisms/kudos-dialog/kudos-dialog.tsx — Dialog + AutocompleteTextarea + the postcard's text tools and stickers"
      summary="A Kudos written on a portrait card in front of the page: one side, the words in the middle, and whoever they @mention is who it is for, or the whole Workspace if they mention nobody. A row of small cards chooses the template; stickers go on top and can be hidden. Sent, it is pinned to a board, which stays with a way back to Home."
      useFor="Giving Kudos from Home's + menu."
      avoidFor="Feedback, which has a Visibility and a back and front; use PostcardDialog."
      usage={`import { KudosDialog } from '@/components/organisms/kudos-dialog/kudos-dialog';

<KudosDialog
  teammates={teammates}
  workspaceGoals={workspaceGoals}
  open={open}
  onOpenChange={setOpen}
  onSend={(kudos) => giveKudos(kudos)}
/>`}
      props={[
        {
          name: 'teammates',
          type: 'Teammate[]',
          description:
            'Who `@` offers, which is who it can be for: the Workspace but the writer.',
        },
        {
          name: 'workspaceGoals',
          type: 'string[]',
          description:
            "The Workspace's active Workspace Goals, by name, offered on `#`.",
        },
        {
          name: 'open / onOpenChange',
          type: 'boolean / (open: boolean) => void',
          description:
            'Whether it is open. Each opening is a blank card on a template chosen at random. It closes itself on Back to home and after a confirmed Discard.',
        },
        {
          name: 'onSend',
          type: '(kudos: KudosDraft) => Promise<boolean>',
          description:
            'Send was pressed. Resolve true once it has gone, and the card is pinned to the board, which stays open; resolve false and it stays open as it was, with saying why left to the caller.',
        },
        {
          name: 'onCloseAutoFocus',
          type: '(event: Event) => void',
          description:
            'Closed. Focus goes back to whatever had it when the card opened; prevent the default to send it somewhere else.',
        },
      ]}
      accessibility={[
        'The title names the dialog, and focus starts in the words.',
        'The templates are native radios, named for each template, so the arrow keys move along the row.',
        'Who it is for is announced as it changes. The field says its limit; the count beside it is not read out on every keystroke.',
        'The bar is a group named for what it holds: Kudos tools, or Text style while the words are written in.',
        'The board and the pin are decoration, hidden from screen readers. Once the card is pinned, focus goes to Back to home, and Escape takes it too. With reduced motion the card is pinned with no movement.',
      ]}
    >
      <StateCell
        label="Give kudos"
        hint="A blank card, on a template chosen at random."
      >
        <KudosDialogDemo />
      </StateCell>
      <StateCell
        label="Templates"
        hint="The six cards, as the row offers them."
      >
        <div className="grid w-full grid-cols-3 gap-3">
          {KUDOS_TEMPLATE_KEYS.map((key) => (
            <KudosCardFace key={key} templateKey={key} />
          ))}
        </div>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function KudosDialogPreview() {
  return (
    <div className="w-24">
      <KudosCardFace templateKey="cobalt-dash" />
    </div>
  );
}
