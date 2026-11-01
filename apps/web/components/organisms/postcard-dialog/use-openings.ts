import { useState } from 'react';

/**
 * How many times a dialog has been opened, to key its editor by: a new opening gets a new editor,
 * so its state starts blank. Counted while rendering rather than in an effect, so the first frame
 * of an opening is already the blank card.
 */
export function useOpenings(open: boolean): number {
  const [openings, setOpenings] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setOpenings((count) => count + 1);
    }
  }
  return openings;
}
