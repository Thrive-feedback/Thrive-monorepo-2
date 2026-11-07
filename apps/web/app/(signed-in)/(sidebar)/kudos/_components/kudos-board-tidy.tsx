'use client';

import { BrushCleaningIcon } from 'lucide-react';
import { KUDOS_BOARD_HEADING_ID } from '@/app/(signed-in)/(brand-new)/kudos/_lib/kudos-board.constant';
import { Button } from '@/components/atoms/button';
import { useKudosBoardPlaces } from './kudos-board-places';

/**
 * Puts every card back where it hangs, front side up, on every page. Only where cards can be moved
 * at all, so a phone never shows it. With nothing to tidy it is disabled, and that includes the
 * moment it has been used, which would drop the focus, so that goes to the page's title.
 */
export function KudosBoardTidy() {
  const { isTidy, hasTidied, tidyUp } = useKudosBoardPlaces();

  function handleClick() {
    tidyUp();
    document.getElementById(KUDOS_BOARD_HEADING_ID)?.focus();
  }

  return (
    <div className="pointer-fine:block hidden">
      <Button disabled={isTidy} onClick={handleClick}>
        <BrushCleaningIcon aria-hidden="true" className="size-4.5" />
        Tidy up
      </Button>
      <span role="status" className="sr-only">
        {hasTidied ? 'Board tidied.' : ''}
      </span>
    </div>
  );
}
