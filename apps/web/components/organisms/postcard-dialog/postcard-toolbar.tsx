import { ChevronDownIcon, PaletteIcon, StampIcon } from 'lucide-react';
import { memo, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import { VisibilityMenu } from '@/components/organisms/visibility-menu';
import { SELECTED_PEOPLE } from '@/components/organisms/visibility-picker';
import { cn } from '@/lib/cn.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import styles from './postcard.module.css';
import type { PostcardVisibility } from './postcard-draft.type';
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

const VISIBILITY_OPTIONS: readonly {
  value: PostcardVisibility;
  label: string;
}[] = [
  { value: 'ONLY_ME', label: 'Only them' },
  { value: SELECTED_PEOPLE, label: 'Selected people' },
  { value: 'EVERYONE', label: 'Everyone in the Workspace' },
];

/** What each choice means, by name, with the warning that it is final. */
function visibilityMeaning(
  visibility: PostcardVisibility,
  recipientNames: readonly string[],
) {
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
  tone: PaperTone;
  visibility: PostcardVisibility;
  /** Who can be picked under Selected people: the Workspace but the writer and the Receivers. */
  people: readonly Teammate[];
  selectedAccountIds: ReadonlySet<string>;
  /** Who the postcard is for, by name: they always read it, and the choices say so. */
  recipientNames: readonly string[];
  onToneChange: (tone: PaperTone) => void;
  onVisibilityChange: (visibility: PostcardVisibility) => void;
  onSelectedChange: (accountIds: ReadonlySet<string>) => void;
};

/**
 * The postcard's floating bar while nothing on it is being styled: Stamps, which are not ready,
 * the paper the card is printed on, and who else can read it. On a phone the tools keep their
 * icons and drop their words. Memoised: typing the message changes none of its props.
 */
export const PostcardToolbar = memo(function PostcardToolbar({
  tone,
  visibility,
  people,
  selectedAccountIds,
  recipientNames,
  onToneChange,
  onVisibilityChange,
  onSelectedChange,
}: PostcardToolbarProps) {
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <PostcardToolButton aria-disabled="true">
            <StampIcon aria-hidden="true" className="size-4.5" />
            <span className="max-sm:sr-only">Stamps </span>(0/3)
          </PostcardToolButton>
        </TooltipTrigger>
        <TooltipContent>Stamps are coming soon.</TooltipContent>
      </Tooltip>
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
        options={VISIBILITY_OPTIONS}
        value={visibility}
        people={people}
        selectedAccountIds={selectedAccountIds}
        helperText={visibilityMeaning(visibility, recipientNames)}
        peopleDescription={`${recipientNames.length > 0 ? listFormat.format(recipientNames) : 'Whoever it is for'} and you can always read it.`}
        open={isVisibilityOpen}
        onOpenChange={setIsVisibilityOpen}
        onValueChange={onVisibilityChange}
        onSelectedChange={onSelectedChange}
      />
    </>
  );
});
