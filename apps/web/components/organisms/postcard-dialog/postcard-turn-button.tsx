import { Rotate3dIcon } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import type { PostcardSide } from './postcard-draft.type';

export type PostcardTurnButtonProps = {
  /** The side showing. */
  side: PostcardSide;
  /** What the tooltip says while the front shows, such as "Turn over to read the back". */
  turnToBackHint: string;
  /** What a screen reader hears, for a card whose sides are not a picture and a message. */
  toFrontLabel?: string;
  toBackLabel?: string;
  onClick: () => void;
};

/** Turns the card over. It is named for the side it turns to. */
export function PostcardTurnButton({
  side,
  turnToBackHint,
  toFrontLabel = 'Turn over to the front, the picture',
  toBackLabel = 'Turn over to the back, the message',
  onClick,
}: PostcardTurnButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          onClick={onClick}
          className="shadow-med"
        >
          <Rotate3dIcon aria-hidden="true" className="size-4.5" />
          <span className="sr-only">
            {side === 'back' ? toFrontLabel : toBackLabel}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {side === 'back' ? 'Turn over to see the front' : turnToBackHint}
      </TooltipContent>
    </Tooltip>
  );
}
