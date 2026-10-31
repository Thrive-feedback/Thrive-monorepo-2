import { useRef, useState } from 'react';
import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';
import { focusedControl } from './postcard-focus.util';

export type UsePostcardLeaveOptions = {
  /** Whether the card can still be left; one on its way cannot. */
  isWriting: boolean;
  /** Where focus goes if the control that asked has gone. */
  fallbackRef: React.RefObject<HTMLElement | null>;
  /** The writer chose to leave. */
  onLeave: () => void;
};

/**
 * Leaving a card: closing always asks first. Keep writing puts the cursor back where it was, and
 * leaving leaves it to the card's own close, since nothing here is a `DialogTrigger`.
 */
export function usePostcardLeave({
  isWriting,
  fallbackRef,
  onLeave,
}: UsePostcardLeaveOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const askedFromRef = useRef<HTMLElement | null>(null);
  const isLeavingRef = useRef(false);

  function askToClose() {
    if (!isWriting) {
      return;
    }
    askedFromRef.current = focusedControl();
    setIsOpen(true);
  }

  function handleCloseAutoFocus(event: Event) {
    event.preventDefault();
    if (isLeavingRef.current) {
      return;
    }
    const back = askedFromRef.current?.isConnected
      ? askedFromRef.current
      : fallbackRef.current;
    back?.focus();
  }

  function handleLeave() {
    isLeavingRef.current = true;
    setIsOpen(false);
    onLeave();
  }

  return {
    askToClose,
    leaveDialog: {
      open: isOpen,
      onOpenChange: setIsOpen,
      onCloseAutoFocus: handleCloseAutoFocus,
      onLeave: handleLeave,
    },
  };
}

export type PostcardLeaveDialogProps = {
  open: boolean;
  /** Anything has been done to the card, so there is something to lose. */
  hasWritten: boolean;
  /** What goes, said when `hasWritten`. */
  lost: string;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus: (event: Event) => void;
  onLeave: () => void;
};

/** Asks before a card is closed, and says what would go. */
export function PostcardLeaveDialog({
  open,
  hasWritten,
  lost,
  onOpenChange,
  onCloseAutoFocus,
  onLeave,
}: PostcardLeaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hasCloseButton={false} onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>Close without sending?</DialogTitle>
          <DialogDescription>
            {hasWritten ? lost : 'Nothing on this card will be kept.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Keep writing</Button>
          </DialogClose>
          <Button variant="danger" onClick={onLeave}>
            {hasWritten ? 'Discard' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
