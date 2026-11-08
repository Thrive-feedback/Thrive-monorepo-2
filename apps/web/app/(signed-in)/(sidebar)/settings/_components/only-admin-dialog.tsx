'use client';

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

export type OnlyAdminDialogProps = {
  /** The Admin in question, as Teammates names them. */
  name: string;
  workspaceName: string;
  /** The signed-in person themselves, so it says "you". */
  isSelf: boolean;
  /** What being the only Admin stops: leaving, or becoming a Member. */
  blocked: 'leave' | 'demote';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What opens it, when something on the page does; a menu item opens it by `open` instead. */
  children?: React.ReactNode;
  /**
   * Where focus goes back to once it closes, when it was opened from a menu whose item is gone by
   * then: the menu's own button.
   */
  returnFocusTo?: React.RefObject<HTMLElement | null>;
};

/**
 * Why the only Admin cannot leave or become a Member: a Workspace always needs one, so somebody
 * else has to be made an Admin first. Nothing is changed; it is answered with "Got it".
 */
export function OnlyAdminDialog({
  name,
  workspaceName,
  isSelf,
  blocked,
  open,
  onOpenChange,
  children,
  returnFocusTo,
}: OnlyAdminDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent
        hasCloseButton={false}
        onCloseAutoFocus={(event) => {
          if (returnFocusTo?.current) {
            event.preventDefault();
            returnFocusTo.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isSelf ? "You're the only Admin" : `${name} is the only Admin`}
          </DialogTitle>
          <DialogDescription>
            {`${workspaceName} always needs at least one Admin. Make someone else an Admin first, then ${
              isSelf ? 'you' : 'they'
            } can ${blocked === 'leave' ? 'leave' : 'become a Member'}.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="primary">Got it</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
