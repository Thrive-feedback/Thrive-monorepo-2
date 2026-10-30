import { CheckIcon } from 'lucide-react';
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
import { POSTCARD_STAMPS } from './postcard-stamp.constant';
import { PostcardStampIcon } from './postcard-stamp-icon';
import { PostcardToolButton } from './postcard-tool-button';
import { usePostcardDrawerContainer } from './use-postcard-drawer-container';

export type PostcardStampPickerProps = {
  /** The stamp on the card, or `null` for none. */
  stampKey: string | null;
  isOpen: boolean;
  onStampChange: (stampKey: string) => void;
  onOpenChange: (isOpen: boolean) => void;
};

/**
 * Stamp, on the back's bar only: a drawer of every stamp, which behaves as Stickers does. A card
 * carries one, so pressing another swaps it, and the drawer closes. The one on the card is marked.
 */
export function PostcardStampPicker({
  stampKey,
  isOpen,
  onStampChange,
  onOpenChange,
}: PostcardStampPickerProps) {
  const container = usePostcardDrawerContainer();

  function handleChoose(key: string) {
    onStampChange(key);
    onOpenChange(false);
  }

  return (
    <Drawer modal={false} open={isOpen} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <PostcardToolButton data-stamp-tool>
          <PostcardStampIcon className="h-4.5 w-auto" />
          <span className="max-sm:sr-only">Stamp</span>
        </PostcardToolButton>
      </DrawerTrigger>
      <DrawerContent container={container} data-stamp-panel>
        <DrawerHeader>
          <DrawerTitle>Stamp</DrawerTitle>
          <DrawerDescription>
            One for your card, in the corner of the back. Choose another to swap
            it.
          </DrawerDescription>
        </DrawerHeader>
        <ul className="grid grid-cols-3 gap-3">
          {POSTCARD_STAMPS.map((stamp) => (
            <li key={stamp.key}>
              <button
                type="button"
                aria-label={`Use the ${stamp.alt} stamp`}
                aria-pressed={stamp.key === stampKey}
                onClick={() => handleChoose(stamp.key)}
                className="relative block w-full cursor-pointer rounded-element p-1 hover:bg-action-neutral-surface-hover aria-pressed:bg-action-neutral-surface-hover"
              >
                <span className={cn('block', styles.lift)}>
                  <span className={cn('block aspect-square', styles.stamp)}>
                    <span className="relative block size-full overflow-hidden border border-border-strong">
                      <PostcardPicture
                        picture={stamp}
                        alt=""
                        sizes="6rem"
                        fallbackClassName="p-1 text-tag"
                      />
                    </span>
                  </span>
                </span>
                {stamp.key === stampKey && (
                  <span className="absolute top-0 right-0 flex size-6 items-center justify-center rounded-full bg-action-primary text-fg-on-action shadow-med">
                    <CheckIcon aria-hidden="true" className="size-4" />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </DrawerContent>
    </Drawer>
  );
}
