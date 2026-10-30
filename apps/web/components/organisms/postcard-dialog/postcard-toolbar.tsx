import { ChevronDownIcon, PaletteIcon } from 'lucide-react';
import { memo, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { VisibilityMenu } from '@/components/organisms/visibility-menu';
import { SELECTED_PEOPLE } from '@/components/organisms/visibility-picker';
import { cn } from '@/lib/cn.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import styles from './postcard.module.css';
import type { PostcardKind, PostcardVisibility } from './postcard-draft.type';
import { PostcardStampPicker } from './postcard-stamp-picker';
import {
  PAPER_TONE_KEYS,
  PAPER_TONES,
  type PaperTone,
} from './postcard-style.constant';
import {
  PostcardToolButton,
  PostcardToolDivider,
} from './postcard-tool-button';

const listFormat = new Intl.ListFormat('en', { type: 'conjunction' });

/**
 * The Visibilities by the names each card gives them: whoever Feedback is given to always reads
 * it, so the Giver's narrowest choice is "Only them"; the Requester's is "Only me".
 */
const VISIBILITY_LABELS: Readonly<
  Record<'give' | 'ask', Record<PostcardVisibility, string>>
> = {
  give: {
    ONLY_ME: 'Only them',
    SELECTED_PEOPLE: 'Selected people',
    EVERYONE: 'Everyone in the Workspace',
  },
  ask: {
    ONLY_ME: 'Only me',
    SELECTED_PEOPLE: 'Selected people',
    EVERYONE: 'Everyone in the Workspace',
  },
};

const VISIBILITY_ORDER: readonly PostcardVisibility[] = [
  'ONLY_ME',
  SELECTED_PEOPLE,
  'EVERYONE',
];

/** What each choice means, by name, with the warning that it is final. */
function visibilityMeaning(
  kind: 'give' | 'ask',
  visibility: PostcardVisibility,
  recipientNames: readonly string[],
) {
  if (kind === 'ask') {
    const meaning = {
      ONLY_ME: 'You and whoever wrote the answer.',
      [SELECTED_PEOPLE]:
        'You, whoever wrote the answer, and the people you choose. They see it in the Feed.',
      EVERYONE: 'Answers appear in the Feed for every Member.',
    }[visibility];
    return `${meaning} Every answer shows who wrote it. You can't change this after you send.`;
  }
  const them =
    recipientNames.length > 0 ? recipientNames : ['the person you choose'];
  const meaning = {
    ONLY_ME: `${listFormat.format(['You', ...them])}.`,
    [SELECTED_PEOPLE]: `${listFormat.format(['You', ...them, 'the people you choose'])}. They see it in the Feed.`,
    EVERYONE: `It appears in the Feed for every Member, with your name and ${listFormat.format(them)}.`,
  }[visibility];
  return `${meaning} You can't change this after you send.`;
}

export type PostcardToolbarProps = {
  /** Which tools the card offers: an answer keeps the Requester's paper and never shows who reads it. */
  kind: PostcardKind;
  tone: PaperTone;
  visibility: PostcardVisibility;
  /** Who can be picked under Selected people: the Workspace but the writer and the Receivers. */
  people: readonly Teammate[];
  selectedAccountIds: ReadonlySet<string>;
  /** Who the postcard is for, by name: they always read it, and the choices say so. */
  recipientNames: readonly string[];
  /** How many stamps the card carries already, on both sides. */
  stampCount: number;
  onToneChange: (tone: PaperTone) => void;
  onVisibilityChange: (visibility: PostcardVisibility) => void;
  onSelectedChange: (accountIds: ReadonlySet<string>) => void;
  /** Adds a stamp to the back, which is the side showing. */
  onAddStamp: (stampKey: string) => void;
};

/**
 * The postcard's floating bar while nothing on it is being styled: stamps for the back, the paper
 * the card is printed on, and who else can read it. Giving and asking offer all three; an answer
 * offers only stamps, since it is written on the Requester's paper and the person answering is
 * never told who reads it. On a phone the tools keep their icons and drop their words. Memoised:
 * typing the message changes none of its props.
 */
export const PostcardToolbar = memo(function PostcardToolbar({
  kind,
  tone,
  visibility,
  people,
  selectedAccountIds,
  recipientNames,
  stampCount,
  onToneChange,
  onVisibilityChange,
  onSelectedChange,
  onAddStamp,
}: PostcardToolbarProps) {
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);

  // An answer's paper and audience are the Requester's, so it offers only stamps.
  const writing = kind === 'answer' ? null : kind;
  return (
    <>
      <PostcardStampPicker count={stampCount} onAddStamp={onAddStamp} />
      {writing && (
        <>
          <PostcardToolDivider />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <PostcardToolButton>
                <PaletteIcon aria-hidden="true" className="size-4.5" />
                <span className="max-sm:sr-only">Paper Tone</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-4 rounded-full border border-border-default',
                    styles.swatch,
                    PAPER_TONES[tone].className,
                  )}
                />
                <span className="sr-only">: {PAPER_TONES[tone].label}</span>
                <ChevronDownIcon aria-hidden="true" className="size-4" />
              </PostcardToolButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>Paper Tone</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={tone}
                onValueChange={(value) => {
                  const chosen = PAPER_TONE_KEYS.find((key) => key === value);
                  if (chosen) {
                    onToneChange(chosen);
                  }
                }}
              >
                {PAPER_TONE_KEYS.map((key) => (
                  <DropdownMenuRadioItem
                    key={key}
                    value={key}
                    className="gap-3 py-2.5"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'size-6 rounded-full border border-border-default',
                        styles.swatch,
                        PAPER_TONES[key].className,
                      )}
                    />
                    {PAPER_TONES[key].label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <PostcardToolDivider />
          <VisibilityMenu
            options={VISIBILITY_ORDER.map((value) => ({
              value,
              label: VISIBILITY_LABELS[writing][value],
            }))}
            value={visibility}
            people={people}
            selectedAccountIds={selectedAccountIds}
            helperText={visibilityMeaning(writing, visibility, recipientNames)}
            peopleDescription={
              writing === 'ask'
                ? 'You and whoever wrote an answer can always read it.'
                : `${recipientNames.length > 0 ? listFormat.format(recipientNames) : 'Whoever it is for'} and you can always read it.`
            }
            open={isVisibilityOpen}
            onOpenChange={setIsVisibilityOpen}
            onValueChange={onVisibilityChange}
            onSelectedChange={onSelectedChange}
          />
        </>
      )}
    </>
  );
});
