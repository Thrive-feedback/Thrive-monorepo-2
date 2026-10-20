'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { addWorkspaceGoal } from '@/app/(signed-in)/(member)/settings/workspace-goals/_lib/workspace-goal-actions.service';
import {
  checkDescription,
  checkName,
  hashtagOf,
  tidyName,
} from '@/app/(signed-in)/(member)/settings/workspace-goals/_lib/workspace-goal-name.util';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { TextField } from '@/components/molecules/text-field';

export type AddWorkspaceGoalFormProps = {
  /** The Workspace the page was drawn for; adding is refused once the person is no longer in it. */
  workspaceId: string;
};

type Errors = {
  readonly name?: string;
  readonly description?: string;
  readonly form?: string;
};

/**
 * Adds a Workspace Goal: a name, written as Members will write it after `#`, and an optional one
 * sentence on what it means. Both are checked before anything is sent, so the Admin hears about a
 * space or a length at once; a name already taken comes back from the API under the name. On
 * success the fields clear and a toast names the new one, which appears in the list above.
 */
export function AddWorkspaceGoalForm({
  workspaceId,
}: AddWorkspaceGoalFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [isAdding, startAdding] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const refused: Errors = {
      name: checkName(name),
      description: checkDescription(description),
    };
    setErrors(refused);
    if (refused.name || refused.description) {
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
        setErrors({});
      } else {
        setErrors({ [result.field]: result.message });
      }
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label="Name"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="ownership"
        helperText="Up to 30 characters. Use - instead of spaces."
        errorMessage={errors.name}
        autoComplete="off"
      />
      <TextField
        label="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="We finish what we start."
        helperText="Optional. One sentence on what it means."
        errorMessage={errors.description}
        autoComplete="off"
      />
      {errors.form && (
        <Text role="alert" variant="body-2" tone="danger">
          {errors.form}
        </Text>
      )}
      <Button
        type="submit"
        variant="primary"
        loading={isAdding}
        className="self-start"
      >
        Add Workspace Goal
      </Button>
    </form>
  );
}
