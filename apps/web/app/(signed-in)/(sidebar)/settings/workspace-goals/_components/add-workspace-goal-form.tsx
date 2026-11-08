'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { addWorkspaceGoal } from '@/app/(signed-in)/(sidebar)/settings/workspace-goals/_lib/workspace-goal-actions.service';
import {
  checkDescription,
  checkName,
  hashtagOf,
  tidyName,
} from '@/app/(signed-in)/(sidebar)/settings/workspace-goals/_lib/workspace-goal-name.util';
import { Button } from '@/components/atoms/button';
import { DialogFooter } from '@/components/atoms/dialog';
import { Text } from '@/components/atoms/text';
import { TextField } from '@/components/molecules/text-field';
import { cn } from '@/lib/cn.util';
import { GoalHashtag } from './goal-hashtag';

export type AddWorkspaceGoalFormProps = {
  /** The Workspace the page was drawn for; adding is refused once the person is no longer in it. */
  workspaceId: string;
  /** After a Goal was added, so whatever holds the form can put it away. */
  onAdded?: () => void;
  /** Leaving without adding; draws Cancel beside Add Workspace Goal. */
  onCancel?: () => void;
};

type Errors = {
  readonly name?: string;
  readonly description?: string;
  readonly form?: string;
};

/**
 * Adds a Workspace Goal: a name, written as Members will write it after `#`, and an optional one
 * sentence on what it means. Add Workspace Goal waits until both would be accepted; anything wrong
 * with a field is said under it as it is typed, so the button is never disabled without a reason
 * on screen, and an empty name says nothing until something is in it. A name already taken comes
 * back from the API under the name. A preview draws the hashtag exactly as Feedback will. On
 * success the fields clear and a toast names the new one. The actions sit at the end, as a
 * dialog's do.
 */
export function AddWorkspaceGoalForm({
  workspaceId,
  onAdded,
  onCancel,
}: AddWorkspaceGoalFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [refused, setRefused] = useState<Errors>({});
  const [isAdding, startAdding] = useTransition();
  const nameProblem = tidyName(name) === '' ? undefined : checkName(name);
  const descriptionProblem = checkDescription(description);
  const isReady =
    checkName(name) === undefined && descriptionProblem === undefined;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isReady) {
      return;
    }
    startAdding(async () => {
      const result = await addWorkspaceGoal(workspaceId, {
        name,
        description,
      });
      if (result.ok) {
        toast.success(`${hashtagOf(tidyName(name))} added`);
        setName('');
        setDescription('');
        setRefused({});
        onAdded?.();
      } else {
        setRefused({ [result.field]: result.message });
      }
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label="Name"
        required
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setRefused({});
        }}
        placeholder="ownership"
        helperText="Up to 30 characters. Use - instead of spaces."
        errorMessage={nameProblem ?? refused.name}
        autoComplete="off"
      />
      <TextField
        label="Description"
        value={description}
        onChange={(event) => {
          setDescription(event.target.value);
          setRefused({});
        }}
        placeholder="We finish what we start."
        helperText="Optional. One sentence on what it means."
        errorMessage={descriptionProblem ?? refused.description}
        autoComplete="off"
      />
      <GoalPreview name={tidyName(name)} />
      {refused.form && (
        <Text role="alert" variant="body-2" tone="danger">
          {refused.form}
        </Text>
      )}
      <DialogFooter className="pt-2">
        {onCancel && (
          <Button disabled={isAdding} onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={isAdding}
          disabled={!isReady}
        >
          Add Workspace Goal
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Shown while nothing is typed, so the preview keeps its shape and says what it is for. */
const PREVIEW_EXAMPLE = 'ownership';

type GoalPreviewProps = {
  /** Tidied as it will be saved, without its `#`; empty until something is typed. */
  name: string;
};

/**
 * The hashtag as a Feedback message will show it. It repeats what the field already holds, so it
 * is a picture only, and assistive technology skips it.
 */
function GoalPreview({ name }: GoalPreviewProps) {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col items-start gap-1 rounded-control border border-border-muted px-4 py-3"
    >
      <Text as="span" variant="body-3" tone="muted">
        In Feedback
      </Text>
      <Text
        as="span"
        variant="body-2"
        className={cn('break-all', name === '' && 'opacity-50')}
      >
        <GoalHashtag name={name === '' ? PREVIEW_EXAMPLE : name} />
      </Text>
    </div>
  );
}
