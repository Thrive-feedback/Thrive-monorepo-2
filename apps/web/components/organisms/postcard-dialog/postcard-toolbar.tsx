import { ChevronDownIcon, PaletteIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { cn } from '@/lib/cn.util';
import styles from './postcard.module.css';
import type { PostcardKind } from './postcard-draft.type';
import { PostcardStampPicker } from './postcard-stamp-picker';
import { PostcardStickerPicker } from './postcard-sticker-picker';
import {
  PAPER_TONE_KEYS,
  PAPER_TONES,
  type PaperTone,
} from './postcard-style.constant';
import {
  PostcardToolButton,
  PostcardToolDivider,
} from './postcard-tool-button';

export type PostcardToolbarProps = {
  /** Which card it is on: an answer takes only stickers. */
  kind: PostcardKind;
  tone: PaperTone;
  /** How many stickers the card carries already, on both sides. */
  stickerCount: number;
  /** The stamp on the card, or `null` for none. */
  stampKey: string | null;
  /** Whether the Stamp drawer is open: the box printed on the card opens it too. */
  isStampPickerOpen: boolean;
  /** Who else can read it, last on the bar. */
  children?: React.ReactNode;
  onToneChange: (tone: PaperTone) => void;
  /** Adds a sticker to the back, which is the side showing. */
  onAddSticker: (stickerKey: string) => void;
  onStampChange: (stampKey: string) => void;
  onStampPickerOpenChange: (isOpen: boolean) => void;
};

/**
 * The postcard's floating bar while nothing on it is being styled: stickers for the back, its
 * stamp, the paper the card is printed on, and who else can read it. Giving and asking offer all
 * four; an answer offers only stickers, since it is written on the Requester's card and the person
 * answering is never told who reads it. On a phone the tools keep their icons and drop their words.
 */
export function PostcardToolbar({
  kind,
  tone,
  stickerCount,
  stampKey,
  isStampPickerOpen,
  children,
  onToneChange,
  onAddSticker,
  onStampChange,
  onStampPickerOpenChange,
}: PostcardToolbarProps) {
  return (
    <>
      <PostcardStickerPicker count={stickerCount} onAddSticker={onAddSticker} />
      {kind !== 'answer' && (
        <>
          <PostcardToolDivider />
          <PostcardStampPicker
            stampKey={stampKey}
            isOpen={isStampPickerOpen}
            onStampChange={onStampChange}
            onOpenChange={onStampPickerOpenChange}
          />
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
          {children}
        </>
      )}
    </>
  );
}
