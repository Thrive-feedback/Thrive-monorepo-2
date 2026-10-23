import { ChevronDownIcon, EyeIcon, SendIcon } from 'lucide-react';
import { Popover } from 'radix-ui';
import { Button } from '@/components/atoms/button';
import type { LetterSide } from '@/components/organisms/letter';
import {
  SELECTED_PEOPLE,
  VisibilityPicker,
} from '@/components/organisms/visibility-picker';
import type { Teammate } from '@/lib/feedback/teammate.type';

export type LetterVisibility = 'ONLY_ME' | typeof SELECTED_PEOPLE | 'EVERYONE';

const ORDER: readonly LetterVisibility[] = [
  'ONLY_ME',
  SELECTED_PEOPLE,
  'EVERYONE',
];

/** The Visibilities by the names each letter gives them: the Giver's "Only them" is the Requester's "Only me". */
const LABELS: Readonly<Record<LetterSide, Record<LetterVisibility, string>>> = {
  feedback: {
    ONLY_ME: 'Only them',
    SELECTED_PEOPLE: 'Selected people',
    EVERYONE: 'Everyone in the Workspace',
  },
  request: {
    ONLY_ME: 'Only me',
    SELECTED_PEOPLE: 'Selected people',
    EVERYONE: 'Everyone in the Workspace',
  },
};

/** What each choice means, said under the choices. */
const MEANS: Readonly<Record<LetterSide, Record<LetterVisibility, string>>> = {
  feedback: {
    ONLY_ME: 'Only the two of you will read it.',
    SELECTED_PEOPLE: 'The people you pick can also read it.',
    EVERYONE: 'Everyone in your Workspace can read it.',
  },
  request: {
    ONLY_ME: 'Only you will read what they send back.',
    SELECTED_PEOPLE: 'The people you pick can also read what they send back.',
    EVERYONE: 'Everyone in your Workspace can read what they send back.',
  },
};

export type LetterSendBarProps = {
  side: LetterSide;
  visibility: LetterVisibility;
  /** Who can be picked under Selected people. */
  people: readonly Teammate[];
  selectedAccountIds: ReadonlySet<string>;
  /** Whether everything a letter needs is there; Send waits until it is. */
  ready: boolean;
  onVisibilityChange: (visibility: LetterVisibility) => void;
  onSelectedChange: (accountId: string, selected: boolean) => void;
  onSend: () => void;
};

/**
 * The bar that floats at the foot of the page under the letter being written: who else can read
 * it, chosen in a panel that opens from the bar, and Send.
 */
export function LetterSendBar({
  side,
  visibility,
  people,
  selectedAccountIds,
  ready,
  onVisibilityChange,
  onSelectedChange,
  onSend,
}: LetterSendBarProps) {
  const options = ORDER.map((value) => ({ value, label: LABELS[side][value] }));

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border-muted bg-surface-raised p-1.5 shadow-high">
      <Popover.Root>
        <Popover.Trigger asChild>
          <Button
            variant="ghost"
            className="rounded-full"
            prefixIcon={<EyeIcon />}
          >
            <span className="sr-only">Who else can read it: </span>
            {LABELS[side][visibility]}
            <ChevronDownIcon />
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="top"
            sideOffset={12}
            className="z-50 flex w-80 flex-col gap-3 rounded-control border border-border-muted bg-surface-raised p-4 text-fg-primary shadow-med"
          >
            <VisibilityPicker
              options={options}
              value={visibility}
              people={people}
              selectedAccountIds={selectedAccountIds}
              helperText={MEANS[side][visibility]}
              onValueChange={onVisibilityChange}
              onSelectedChange={onSelectedChange}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <Button
        variant="primary"
        className="rounded-full"
        prefixIcon={<SendIcon />}
        disabled={!ready}
        onClick={onSend}
      >
        Send
      </Button>
    </div>
  );
}
