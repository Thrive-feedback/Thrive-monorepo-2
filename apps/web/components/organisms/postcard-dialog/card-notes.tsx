import { LightbulbIcon, LightbulbOffIcon } from 'lucide-react';
import { createContext, useState } from 'react';
import { Button } from '@/components/atoms/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';

const STORAGE_KEY = 'thrive.card-notes';
const HIDDEN = 'hidden';

function readAreNotesShown() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== HIDDEN;
  } catch {
    return true;
  }
}

function rememberAreNotesShown(areShown: boolean) {
  try {
    if (areShown) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, HIDDEN);
    }
  } catch {
    // Storage can be refused: the choice still holds until the card closes.
  }
}

/** Whether the notes beside a card are showing, for each `CardToolNote` in it. */
export const CardNotesContext = createContext(true);

/** Whether the notes are showing. Someone who turns them off has seen them, so it is remembered. */
export function useCardNotes() {
  const [areNotesShown, setAreNotesShown] = useState(readAreNotesShown);

  function handleToggleNotes() {
    rememberAreNotesShown(!areNotesShown);
    setAreNotesShown(!areNotesShown);
  }

  return { areNotesShown, handleToggleNotes };
}

export type CardNotesButtonProps = {
  areNotesShown: boolean;
  /** There are no notes on this card for it to turn off or on. */
  disabled?: boolean;
  onClick: () => void;
};

/**
 * Turns the notes beside a card off and on, under the button that hides its stickers. Only where
 * notes can show at all, which is where there is room beside the card.
 */
export function CardNotesButton({
  areNotesShown,
  disabled,
  onClick,
}: CardNotesButtonProps) {
  const label = areNotesShown ? 'Hide tips' : 'Show tips';
  const Icon = areNotesShown ? LightbulbIcon : LightbulbOffIcon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          disabled={disabled}
          onClick={onClick}
          className="hidden shadow-med lg:inline-flex"
        >
          <Icon aria-hidden="true" className="size-4.5" />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
