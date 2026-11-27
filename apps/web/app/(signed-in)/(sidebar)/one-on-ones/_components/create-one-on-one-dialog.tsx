'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { OneOnOneScheduleChoice } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import { inviteToOneOnOne } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-actions.service';
import { DEFAULT_SCHEDULE } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-schedule.util';
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
import type { Teammate } from '@/lib/feedback/teammate.type';
import { ROUTES } from '@/lib/routes.constant';
import { ScheduleFields } from './schedule-fields';
import { TeammateChoice } from './teammate-choice';

const NOTE_LIMIT = 280;

export type CreateOneOnOneDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  teammates: readonly Teammate[];
  /** Teammates the person already has a 1:1 with, each with the reason said for them. */
  unavailable: ReadonlyMap<string, string>;
  /** What opens it, which takes focus back when it closes. */
  trigger: React.ReactNode;
};

/**
 * Creating a 1:1 in two steps: who it is with, then when it meets and, if the person likes, what they would like to talk about. The teammate is invited, and accepts or
 * declines.
 */
export function CreateOneOnOneDialog({
  open,
  onOpenChange,
  workspaceId,
  teammates,
  unavailable,
  trigger,
}: CreateOneOnOneDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [chosen, setChosen] = useState<string | null>(null);
  const [schedule, setSchedule] =
    useState<OneOnOneScheduleChoice>(DEFAULT_SCHEDULE);
  const [note, setNote] = useState('');
  const [isSending, startSending] = useTransition();
  const person = teammates.find((teammate) => teammate.accountId === chosen);

  function reset() {
    setStep(1);
    setChosen(null);
    setSchedule(DEFAULT_SCHEDULE);
    setNote('');
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset();
    }
    onOpenChange(next);
  }

  function send() {
    if (!chosen) {
      return;
    }
    startSending(async () => {
      const result = await inviteToOneOnOne(
        workspaceId,
        chosen,
        schedule,
        note,
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(
        person ? `Invitation sent to ${person.name}` : 'Invitation sent',
      );
      handleOpenChange(false);
      router.push(
        result.id ? ROUTES.oneOnOneWith(result.id) : ROUTES.oneOnOnes,
      );
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="gap-5">
        <DialogHeader>
          <DialogTitle>
            {step === 1 || !person
              ? 'Create a 1:1'
              : `A 1:1 with ${person.name}`}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Choose a teammate. Nothing is scheduled until they accept.'
              : 'Pick how often and which day. You can both change it later.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <TeammateChoice
            teammates={teammates}
            value={chosen}
            unavailable={unavailable}
            onChange={setChosen}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <ScheduleFields
              value={schedule}
              disabled={isSending}
              onChange={setSchedule}
            />
            <TextAreaField
              label="Anything you’d like to talk about?"
              placeholder="Optional. For example, how the launch went"
              value={note}
              maxLength={NOTE_LIMIT}
              helperText={`${note.length} of ${NOTE_LIMIT}`}
              disabled={isSending}
              onChange={(event) => setNote(event.currentTarget.value)}
            />
          </div>
        )}

        <DialogFooter className="items-center">
          <Text as="p" variant="body-3" tone="muted" className="me-auto">
            Step {step} of 2
          </Text>
          {step === 1 ? (
            <>
              <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                key="next"
                variant="primary"
                disabled={!chosen}
                onClick={() => setStep(2)}
              >
                Next
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                disabled={isSending}
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                key="send"
                variant="primary"
                loading={isSending}
                onClick={send}
              >
                Send invitation
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
