import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { KudosCardDemo, KudosCardReadDialogDemo } from './kudos-card-demos';
import { KUDOS_CASES, SAMPLE_KUDOS } from './kudos-samples.constant';

export function KudosCardReadDialogEntry() {
  return (
    <ShowcaseEntry
      name="KudosCardReadDialog"
      level="organism"
      origin="thrive"
      source="components/organisms/kudos-dialog/kudos-card-read-dialog.tsx — Dialog + KudosCardReadOnly + GiverToReceivers + the postcard's title row, turn and hide buttons"
      summary="A sent Kudos card in front of the page, at the size it was written at, with who gave it to whom under it. It turns over to the day it was given, and its stickers clear away to read what lies under them. It reads what the page already holds, so it asks the API for nothing."
      useFor="Reading one Kudos large, from the Kudos board or Home's feed."
      avoidFor="Writing one, which is KudosDialog. A postcard, which is PostcardReadDialog."
      usage={`import { KudosCardReadDialog } from '@/components/organisms/kudos-dialog/kudos-card-read-dialog';

<KudosCardReadDialog kudos={kudos} open={open} onOpenChange={setOpen} />`}
      props={[
        {
          name: 'kudos',
          type: 'ReadKudos',
          description:
            'The Kudos to show, as toReadKudos makes it from what the API sends.',
        },
        {
          name: 'open / onOpenChange',
          type: 'boolean / (open: boolean) => void',
          description:
            'Whether it is open. Every opening starts on the front, with its stickers on. Nothing can be lost, so Close and Escape close it at once.',
        },
      ]}
      accessibility={[
        'The title names the dialog: "Kudos from" and who gave it.',
        'Focus goes back to whatever opened it.',
        'The note beside the hide button is hidden from screen readers: the button names itself.',
        'Several receivers are one button that lists them all.',
      ]}
    >
      {KUDOS_CASES.map(({ label, kudos }) => (
        <StateCell key={label} label={label}>
          <KudosCardReadDialogDemo kudos={kudos} label="Read it large" />
        </StateCell>
      ))}
    </ShowcaseEntry>
  );
}

export function KudosCardReadDialogPreview() {
  return (
    <div className="w-24">
      <KudosCardDemo kudos={SAMPLE_KUDOS} />
    </div>
  );
}
