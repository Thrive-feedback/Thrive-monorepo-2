'use client';

import { useState } from 'react';
import type {
  OneOnOneActionResult,
  OneOnOneScheduleChoice,
  OneOnOneTemplate,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import { ScheduleFields } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/schedule-fields';
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

export type ScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initial: OneOnOneScheduleChoice;
  templates: readonly OneOnOneTemplate[];
  /** What the template `initial` names is called, kept as a choice when the list lacks it. */
  initialTemplateName?: string;
  submitLabel: string;
  /** Said once it went. */
  done: string;
  /** What else belongs under the fields. */
  children?: React.ReactNode;
  onSubmit: (schedule: OneOnOneScheduleChoice) => Promise<OneOnOneActionResult>;
  /** What opens it, which takes focus back when it closes. */
  trigger: React.ReactNode;
};

type ScheduleFormProps = Omit<
  ScheduleDialogProps,
  'open' | 'title' | 'description' | 'trigger'
>;

/**
 * The fields and buttons, drawn only while the dialog is open: each opening starts again from the
 * schedule as it now stands, so an edit left by Cancel, or a change the other person made, never
 * shows as the starting point.
 */
function ScheduleForm({
  onOpenChange,
  initial,
  templates,
  initialTemplateName,
  submitLabel,
  done,
  children,
  onSubmit,
}: ScheduleFormProps) {
  const [schedule, setSchedule] = useState(initial);
  const { isPending: isSaving, run } = useOneOnOneAction();

  function submit() {
    run(() => onSubmit(schedule), {
      done,
      onSuccess: () => onOpenChange(false),
    });
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <ScheduleFields
          value={schedule}
          templates={templates}
          currentTemplate={
            initialTemplateName === undefined
              ? undefined
              : { key: initial.templateKey, name: initialTemplateName }
          }
          disabled={isSaving}
          onChange={setSchedule}
        />
        {children}
      </div>
      <DialogFooter>
        <Button
          variant="ghost"
          disabled={isSaving}
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button variant="primary" loading={isSaving} onClick={submit}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * When a 1:1 meets, set in a dialog: by either person changing it once it runs. It stays open, with
 * what was chosen, when the change is refused.
 */
export function ScheduleDialog({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  ...form
}: ScheduleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="gap-5">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ScheduleForm onOpenChange={onOpenChange} {...form} />
      </DialogContent>
    </Dialog>
  );
}
