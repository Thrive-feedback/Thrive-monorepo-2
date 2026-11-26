'use client';

import { CalendarClockIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type {
  OneOnOneSchedule,
  OneOnOneScheduleChoice,
  OneOnOneTemplate,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
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
import { useOneOnOneAction } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/use-one-on-one-action';
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
  /** What opens it, which takes focus back when it closes. */
  trigger: React.ReactNode;
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="gap-5">
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
  templates: readonly OneOnOneTemplate[];
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
  templates,
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
            <DialogTitle>Suggest another time to {shortName}</DialogTitle>
            <DialogDescription>
              {`${shortName} gets it back to accept or decline. Bangkok time.`}
            </DialogDescription>
          </DialogHeader>
          <ScheduleFields
            value={another}
            templates={templates}
            currentTemplate={{
              key: schedule.templateKey,
              name: schedule.templateName,
            }}
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
                    done: `Sent back to ${shortName} with another time`,
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
                Suggest another time instead
              </span>
              <Text as="span" variant="body-3" tone="muted">
                If it’s the time, not the 1:1, send it back with one that suits
                you.
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
              Not now
            </Button>
            <Button
              variant="warning"
              loading={isPending}
              onClick={() =>
                run(() => declineOneOnOne(workspaceId, oneOnOneId, note), {
                  done: `Declined. ${shortName} will see it.`,
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
  templates,
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
            done: `You and ${shortName} have a 1:1`,
          })
        }
      >
        {wasSuggested ? 'Accept this time' : 'Accept'}
      </Button>
      <DeclineButton
        workspaceId={workspaceId}
        oneOnOneId={oneOnOneId}
        shortName={shortName}
        schedule={schedule}
        templates={templates}
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
        description={`It leaves ${shortName}’s list, and yours. You can send another any time.`}
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
  /** A meeting held just once: its time is changed, and it is cancelled rather than ended. */
  isOnce?: boolean;
  schedule: OneOnOneSchedule;
  templates: readonly OneOnOneTemplate[];
};

/**
 * What can be done to a running 1:1, by either person, as the two are equal: change when it meets,
 * which holds at once, or end it, after saying what ending keeps.
 */
export function RunningControls({
  workspaceId,
  oneOnOneId,
  shortName,
  isOnce = false,
  schedule,
  templates,
}: RunningControlsProps) {
  const { isPending, run } = useOneOnOneAction();
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <ScheduleDialog
        trigger={
          <Button variant="secondary">
            {isOnce ? 'Change time' : 'Change schedule'}
          </Button>
        }
        open={isRescheduling}
        onOpenChange={setIsRescheduling}
        title={`When you and ${shortName} meet`}
        description={`Bangkok time. It holds at once, for you and ${shortName}; the next meeting is the first under the new schedule.`}
        initial={choiceOf(schedule)}
        templates={templates}
        initialTemplateName={schedule.templateName}
        submitLabel="Save"
        done={isOnce ? 'Time changed' : 'Schedule changed'}
        onSubmit={(next) => rescheduleOneOnOne(workspaceId, oneOnOneId, next)}
      />
      <Confirm
        trigger={
          <Button variant="ghost-danger">
            {isOnce ? 'Cancel meeting' : 'End schedule'}
          </Button>
        }
        open={isEnding}
        onOpenChange={setIsEnding}
        title={
          isOnce
            ? `Cancel your meeting with ${shortName}?`
            : `End your schedule with ${shortName}?`
        }
        description={
          isOnce
            ? `It won’t take place. It moves to History for you both. Either of you can create a new 1:1 any time.`
            : 'No more meetings are kept. It moves to History for you both, where you still read its past meetings. Either of you can create a new 1:1 any time.'
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
    </div>
  );
}
