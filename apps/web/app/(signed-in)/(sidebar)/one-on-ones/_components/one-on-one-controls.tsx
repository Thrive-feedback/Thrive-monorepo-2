'use client';

import { CalendarClockIcon, CalendarXIcon, EllipsisIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type {
  OneOnOneSchedule,
  OneOnOneScheduleChoice,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import { useOneOnOneAction } from '@/app/(signed-in)/(sidebar)/_lib/use-one-on-one-action';
import { ScheduleDialog } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/schedule-dialog';
import { ScheduleFields } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/schedule-fields';
import {
  acceptOneOnOne,
  declineOneOnOne,
  endOneOnOne,
  rescheduleOneOnOne,
  suggestAnotherTime,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-actions.service';
import { choiceOf } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-schedule.util';
import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { Text } from '@/components/atoms/text';
import { TextAreaField } from '@/components/molecules/text-area-field';
import { ROUTES } from '@/lib/routes.constant';

const NOTE_LIMIT = 280;

type Base = {
  workspaceId: string;
  oneOnOneId: string;
  /** The other person's first name, for the words on the buttons and dialogs. */
  shortName: string;
};

type ConfirmProps = {
  /** What opens it, which takes focus back when it closes. Left out when a menu item opens it. */
  trigger?: React.ReactNode;
  /** Where focus goes when it closes, for one opened without a trigger, as from a menu. */
  returnFocusTo?: () => HTMLElement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirm: string;
  keep: string;
  isPending: boolean;
  onConfirm: () => void;
  children?: React.ReactNode;
};

/** A step that cannot be taken back, said plainly before it is taken. */
function Confirm({
  trigger,
  returnFocusTo,
  open,
  onOpenChange,
  title,
  description,
  confirm,
  keep,
  isPending,
  onConfirm,
  children,
}: ConfirmProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className="gap-5"
        onCloseAutoFocus={
          returnFocusTo
            ? (event) => {
                event.preventDefault();
                returnFocusTo()?.focus();
              }
            : undefined
        }
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {keep}
          </Button>
          <Button variant="warning" loading={isPending} onClick={onConfirm}>
            {confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type AnswerProps = Base & {
  /** What the invitation was sent with, which another time starts from. */
  schedule: OneOnOneSchedule;
};

/**
 * Turning an invitation down, after saying what the other person will see: that it was declined, and
 * a note if one is written. Or, instead, sending it back with another time: the dialog turns into the
 * schedule, started from what was sent, and the invitation then waits on the other person. The form
 * is drawn only while the dialog is open, so each opening starts again from the invitation as it now
 * stands.
 */
function DeclineButton(props: AnswerProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Decline</Button>
      </DialogTrigger>
      <DialogContent className="gap-5">
        <DeclineForm {...props} onClose={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function DeclineForm({
  workspaceId,
  oneOnOneId,
  shortName,
  schedule,
  onClose,
}: AnswerProps & { onClose: () => void }) {
  const { isPending, run } = useOneOnOneAction();
  const router = useRouter();
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [note, setNote] = useState('');
  const [another, setAnother] = useState<OneOnOneScheduleChoice>(() =>
    choiceOf(schedule),
  );

  const noteField = (
    <TextAreaField
      label={`A note for ${shortName}`}
      placeholder={
        isSuggesting
          ? 'Optional. For example, Thursdays are full for me.'
          : 'Optional. For example, can we talk next month instead?'
      }
      value={note}
      maxLength={NOTE_LIMIT}
      helperText={`${note.length} of ${NOTE_LIMIT}`}
      disabled={isPending}
      onChange={(event) => setNote(event.currentTarget.value)}
    />
  );

  return (
    <>
      {isSuggesting ? (
        <>
          <DialogHeader>
            <DialogTitle>Suggest another day to {shortName}</DialogTitle>
            <DialogDescription>
              {`${shortName} gets it back to accept or decline.`}
            </DialogDescription>
          </DialogHeader>
          <ScheduleFields
            value={another}
            disabled={isPending}
            onChange={setAnother}
          />
          {noteField}
          <DialogFooter>
            <Button
              variant="ghost"
              disabled={isPending}
              onClick={() => setIsSuggesting(false)}
            >
              Back
            </Button>
            <Button
              variant="primary"
              loading={isPending}
              onClick={() =>
                run(
                  () =>
                    suggestAnotherTime(workspaceId, oneOnOneId, another, note),
                  {
                    done: `Suggested another day to ${shortName}`,
                    onSuccess: () => onClose(),
                  },
                )
              }
            >
              Send suggestion
            </Button>
          </DialogFooter>
        </>
      ) : (
        <>
          <DialogHeader>
            <DialogTitle>Decline {shortName}’s invitation?</DialogTitle>
            <DialogDescription>
              {`${shortName} sees that you declined, and your note if you write one. Either of you can create another 1:1 later.`}
            </DialogDescription>
          </DialogHeader>
          <button
            type="button"
            onClick={() => setIsSuggesting(true)}
            disabled={isPending}
            className="flex items-center gap-3 rounded-control border border-border-muted px-4 py-3 text-start transition-colors duration-quick ease-smooth-out hover:border-action-primary-border hover:bg-action-primary-surface focus-visible:outline-2 focus-visible:outline-action-primary focus-visible:outline-offset-2"
          >
            <CalendarClockIcon
              aria-hidden="true"
              className="size-5 shrink-0 text-fg-accent"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-fg-primary text-subtitle-4">
                Suggest another day instead
              </span>
              <Text as="span" variant="body-3" tone="muted">
                If it’s the day that doesn’t work, suggest one that does. you.
              </Text>
            </span>
          </button>
          {noteField}
          <DialogFooter>
            <Button
              variant="ghost"
              disabled={isPending}
              onClick={() => onClose()}
            >
              Go back
            </Button>
            <Button
              variant="warning"
              loading={isPending}
              onClick={() =>
                run(() => declineOneOnOne(workspaceId, oneOnOneId, note), {
                  done: `You declined. ${shortName} will see that.`,
                  onSuccess: () => {
                    onClose();
                    router.push(ROUTES.oneOnOnes);
                  },
                })
              }
            >
              Decline
            </Button>
          </DialogFooter>
        </>
      )}
    </>
  );
}

export type AnswerInvitationProps = AnswerProps & {
  /** Whether it is the reader's own invitation, sent back to them with another time. */
  wasSuggested?: boolean;
};

/**
 * The person invited answers: it runs from now, on the schedule sent; or they decline it, or send
 * it back with another time.
 */
export function AnswerInvitation({
  workspaceId,
  oneOnOneId,
  shortName,
  schedule,
  wasSuggested = false,
}: AnswerInvitationProps) {
  const { isPending, run } = useOneOnOneAction();
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="primary"
        loading={isPending}
        onClick={() =>
          run(() => acceptOneOnOne(workspaceId, oneOnOneId), {
            done: `You and ${shortName} now have a 1:1`,
          })
        }
      >
        {wasSuggested ? 'Accept this day' : 'Accept'}
      </Button>
      <DeclineButton
        workspaceId={workspaceId}
        oneOnOneId={oneOnOneId}
        shortName={shortName}
        schedule={schedule}
      />
    </div>
  );
}

export type WithdrawProps = Base;

/** Whoever sent an invitation takes it back before it is answered, after saying so. */
export function Withdraw({
  workspaceId,
  oneOnOneId,
  shortName,
}: WithdrawProps) {
  const { isPending, run } = useOneOnOneAction();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Confirm
        trigger={<Button variant="ghost-danger">Withdraw invitation</Button>}
        open={isOpen}
        onOpenChange={setIsOpen}
        title={`Withdraw your invitation to ${shortName}?`}
        description="It’s removed for you both. You can send a new one any time."
        confirm="Withdraw"
        keep="Keep the invitation"
        isPending={isPending}
        onConfirm={() =>
          run(() => endOneOnOne(workspaceId, oneOnOneId), {
            done: `Your invitation to ${shortName} is withdrawn`,
            onSuccess: () => {
              setIsOpen(false);
              router.push(ROUTES.oneOnOnes);
            },
          })
        }
      />
    </>
  );
}

export type RunningControlsProps = Base & {
  /** A meeting held just once: its day is changed, and it is cancelled rather than ended. */
  isOnce?: boolean;
  schedule: OneOnOneSchedule;
};

/**
 * What can be done to a running 1:1, by either person, as the two are equal, behind one quiet menu
 * at the end of its head: change when it meets, which holds at once, or end it, after saying what
 * ending keeps. Each opens its own dialog, and focus comes back to the menu's button.
 */
export function RunningControls({
  workspaceId,
  oneOnOneId,
  shortName,
  isOnce = false,
  schedule,
}: RunningControlsProps) {
  const { isPending, run } = useOneOnOneAction();
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const back = () => menuButton.current;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={menuButton}
            variant="ghost"
            size="icon"
            aria-label={`Schedule options for your 1:1 with ${shortName}`}
          >
            <EllipsisIcon aria-hidden="true" className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setIsRescheduling(true)}>
            <CalendarClockIcon aria-hidden="true" className="size-4" />
            {isOnce ? 'Change day' : 'Change schedule'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem tone="danger" onSelect={() => setIsEnding(true)}>
            <CalendarXIcon aria-hidden="true" className="size-4" />
            {isOnce ? 'Cancel meeting' : 'End schedule'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ScheduleDialog
        returnFocusTo={back}
        open={isRescheduling}
        onOpenChange={setIsRescheduling}
        title={`When you and ${shortName} meet`}
        description="This changes it for you both, starting with the next meeting."
        initial={choiceOf(schedule)}
        submitLabel="Save"
        done={isOnce ? 'Day changed' : 'Schedule changed'}
        onSubmit={(next) => rescheduleOneOnOne(workspaceId, oneOnOneId, next)}
      />
      <Confirm
        returnFocusTo={back}
        open={isEnding}
        onOpenChange={setIsEnding}
        title={
          isOnce
            ? `Cancel your meeting with ${shortName}?`
            : `End your schedule with ${shortName}?`
        }
        description={
          isOnce
            ? 'This meeting won’t happen. It moves to History for you both.'
            : 'No more meetings will be scheduled. It moves to History, where you can both still read past meetings.'
        }
        confirm={isOnce ? 'Cancel meeting' : 'End schedule'}
        keep={isOnce ? 'Keep the meeting' : 'Keep the schedule'}
        isPending={isPending}
        onConfirm={() =>
          run(() => endOneOnOne(workspaceId, oneOnOneId), {
            done: isOnce
              ? `Your meeting with ${shortName} is cancelled`
              : `Your schedule with ${shortName} has ended`,
            onSuccess: () => setIsEnding(false),
          })
        }
      />
    </>
  );
}
