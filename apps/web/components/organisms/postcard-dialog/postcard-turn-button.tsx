import { Rotate3dIcon } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import { cn } from '@/lib/cn.util';
import type { PostcardSide } from './postcard-draft.type';

export type PostcardTurnButtonProps = {
  /** The side showing. */
  side: PostcardSide;
  /** What the tooltip says while the front shows, such as "Turn over to read the back". */
  turnToBackHint: string;
  className?: string;
  onClick: () => void;
};

/**
 * Turns the card over. Beside the card where there is room, so it never covers the writing; above
 * it on a narrow screen. It is named for the side it turns to.
 */
export function PostcardTurnButton({
  side,
  turnToBackHint,
  className,
  onClick,
}: PostcardTurnButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          onClick={onClick}
          className={cn(
            'self-end shadow-med lg:absolute lg:top-1/2 lg:left-full lg:ml-6 lg:-translate-y-1/2',
            className,
          )}
        >
          <Rotate3dIcon aria-hidden="true" className="size-4.5" />
          <span className="sr-only">
            {side === 'back'
              ? 'Turn over to the front, the picture'
              : 'Turn over to the back, the message'}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {side === 'back' ? 'Turn over to see the front' : turnToBackHint}
      </TooltipContent>
    </Tooltip>
  );
}
