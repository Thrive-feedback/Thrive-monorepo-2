import { type RefObject, useCallback, useRef, useState } from 'react';
import type { PostcardStickerChange } from './postcard-sticker';
import { usePressAway } from './use-press-away';

type StickerChange =
  | { kind: 'changeSticker'; id: string; fields: PostcardStickerChange }
  | { kind: 'removeSticker'; id: string };

export type UseCardStickersOptions = {
  /** Changes the draft. Stable, as what this hands on is memoised. */
  change: (change: StickerChange) => void;
  /** Puts a new sticker on the card, under the id given. Stable until where it goes changes. */
  place: (id: string, stickerKey: string) => void;
  toolbarRef: RefObject<HTMLDivElement | null>;
  /** What a press can land on and keep hold of what is selected. */
  keepsSelection: string;
};

/**
 * The stickers on a card: which one is selected, and whether they are showing. Listened for only
 * while one is selected, as the editor stays mounted after the card closes.
 */
export function useCardStickers({
  change,
  place,
  toolbarRef,
  keepsSelection,
}: UseCardStickersOptions) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [areStickersHidden, setAreStickersHidden] = useState(false);
  const stickersAddedRef = useRef(0);

  const letGo = useCallback(() => setSelectedId(null), []);
  usePressAway(selectedId !== null, keepsSelection, letGo);

  // A new sticker goes on selected, so it can be moved straight away, which takes the others being
  // on show too. The bar refuses a fourth; were one to get through, it would select nothing.
  const handleAddSticker = useCallback(
    (stickerKey: string) => {
      stickersAddedRef.current += 1;
      const id = `sticker-${stickersAddedRef.current}`;
      place(id, stickerKey);
      setSelectedId(id);
      setAreStickersHidden(false);
    },
    [place],
  );
  const handleChangeSticker = useCallback(
    (id: string, fields: PostcardStickerChange) =>
      change({ kind: 'changeSticker', id, fields }),
    [change],
  );
  // A sticker taken off takes the cursor with it, so it goes to Stickers, where another can be added.
  const handleRemoveSticker = useCallback(
    (id: string) => {
      change({ kind: 'removeSticker', id });
      setSelectedId((current) => (current === id ? null : current));
      toolbarRef.current
        ?.querySelector<HTMLElement>('[data-stickers-tool]')
        ?.focus();
    },
    [change, toolbarRef],
  );

  // A key press reaches none of the listeners that let go of a selected sticker, and it would stay
  // selected out of sight.
  function handleHideStickers() {
    setAreStickersHidden((current) => !current);
    setSelectedId(null);
  }

  // The stickers go with the card whether they are showing or not, so the card sent shows them.
  function showStickers() {
    setAreStickersHidden(false);
  }

  return {
    selectedId,
    setSelectedId,
    letGo,
    areStickersHidden,
    handleAddSticker,
    handleChangeSticker,
    handleRemoveSticker,
    handleHideStickers,
    showStickers,
  };
}
