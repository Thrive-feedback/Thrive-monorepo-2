import { EyeOffIcon, StickerIcon } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';

export type PostcardHideButtonProps = {
  /** Whether what it hides is hidden now. */
  isHidden: boolean;
  /** What it hides, as it finishes "Hide …" and "Show …": "stickers". */
  what: string;
  disabled?: boolean;
  onClick: () => void;
};

/**
 * Clears what is stuck on the card out of the way, and puts it back, so what lies under it can be
 * seen. It is only a view: nothing on the card changes. It is named for what a press does.
 */
export function PostcardHideButton({
  isHidden,
  what,
  disabled,
  onClick,
}: PostcardHideButtonProps) {
  const label = `${isHidden ? 'Show' : 'Hide'} ${what}`;
  const Icon = isHidden ? EyeOffIcon : StickerIcon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          disabled={disabled}
          onClick={onClick}
          className="shadow-med"
        >
          <Icon aria-hidden="true" className="size-4.5" />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
