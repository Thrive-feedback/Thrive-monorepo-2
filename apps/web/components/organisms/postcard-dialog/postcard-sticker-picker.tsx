import { StickerIcon } from 'lucide-react';
import { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/atoms/drawer';
import { cn } from '@/lib/cn.util';
import styles from './postcard.module.css';
import { PostcardPicture } from './postcard-picture';
import { MAX_STICKERS, POSTCARD_STICKERS } from './postcard-sticker.constant';
import { PostcardToolButton } from './postcard-tool-button';
import { usePostcardDrawerContainer } from './use-postcard-drawer-container';

export type PostcardStickerPickerProps = {
  /** How many stickers the card carries already, on both sides. */
  count: number;
  onAddSticker: (stickerKey: string) => void;
};

/**
 * Stickers, on either side's bar, with how many the card carries: a drawer of every sticker to add to
 * the side showing, which behaves as Templates does. A sticker pressed goes on the card and the
 * drawer closes, so it can be placed at once. A press anywhere outside it puts it away, and since
 * it does not hold the page, that same press reaches the card: pressing a sticker to move it closes
 * the drawer and starts the move. With three on the card, no more can be added until one comes
 * off.
 */
export function PostcardStickerPicker({
  count,
  onAddSticker,
}: PostcardStickerPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const container = usePostcardDrawerContainer();
  const isFull = count >= MAX_STICKERS;

  function handleAdd(stickerKey: string) {
    if (isFull) {
      return;
    }
    onAddSticker(stickerKey);
    setIsOpen(false);
  }

  return (
    <Drawer modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <PostcardToolButton data-stickers-tool>
          <StickerIcon aria-hidden="true" className="size-4.5" />
          <span className="max-sm:sr-only">Stickers </span>({count}/
          {MAX_STICKERS})
        </PostcardToolButton>
      </DrawerTrigger>
      <DrawerContent container={container} data-sticker-panel>
        <DrawerHeader>
          <DrawerTitle>Stickers</DrawerTitle>
          <DrawerDescription>
            Up to three on your card, on either side. A sticker goes on the side
            showing; drag it where you like.
          </DrawerDescription>
        </DrawerHeader>
        <ul className="grid grid-cols-4 gap-2">
          {POSTCARD_STICKERS.map((sticker) => (
            <li key={sticker.key}>
              {/* Not `disabled` when full: the one just pressed keeps the cursor rather than
                  dropping it on the page. */}
              <button
                type="button"
                aria-label={`Add the ${sticker.alt} sticker`}
                aria-disabled={isFull}
                onClick={() => handleAdd(sticker.key)}
                className="block w-full cursor-pointer rounded-element p-1 hover:bg-action-neutral-surface-hover aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-transparent"
              >
                <span
                  className={cn(
                    'relative block aspect-square scale-115',
                    styles.lift,
                  )}
                >
                  <PostcardPicture
                    picture={sticker}
                    alt=""
                    sizes="6rem"
                    fallbackClassName="p-1 text-tag"
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p aria-live="polite" className="text-body-3 text-fg-secondary">
          {isFull ? 'Three is the most. Take one off to add another.' : ''}
        </p>
      </DrawerContent>
    </Drawer>
  );
}
