'use client';

import { startTransition, useActionState, useState } from 'react';
import { Button } from '@/components/atoms/button';
import { DialogFooter } from '@/components/atoms/dialog';
import { Text } from '@/components/atoms/text';
import { TextField } from '@/components/molecules/text-field';
import { TeamSizeOptions } from '@/components/organisms/team-size-options';
import type {
  CreateWorkspaceAction,
  CreateWorkspaceState,
} from '@/lib/workspace/create-workspace-state.type';
import type { TeamSize } from '@/lib/workspace/team-size.constant';

export type CreateWorkspaceFormProps = {
  /** Creates it; Create a Workspace and the switcher each move on to their own next page. */
  action: CreateWorkspaceAction;
  /** The submit button's words, where they should say what happens next. */
  submitLabel?: string;
  /**
   * Leaving without creating, for a form inside a dialog: draws the way out beside the submit
   * button at the dialog's end, as every Settings dialog does. Without it the form stands alone on
   * a page, and its one button spans the width.
   */
  onCancel?: () => void;
  /** The way out's words, where Cancel would not say where it leads. */
  cancelLabel?: string;
};

/**
 * A Workspace's name and, optionally, its team size. Create is disabled until it has a name,
 * since a name of only spaces is no name, and while it is being created, so a second click
 * cannot send it twice.
 *
 * Both fields are controlled, so what was typed and picked stays when creating fails. The
 * form is submitted by hand rather than through `action`, because React resets a form after
 * its action, which would clear the picked team size from the page but not from state.
 */
export function CreateWorkspaceForm({
  action,
  submitLabel = 'Create Workspace',
  onCancel,
  cancelLabel = 'Cancel',
}: CreateWorkspaceFormProps) {
  const [workspaceName, setWorkspaceName] = useState('');
  const [teamSize, setTeamSize] = useState<TeamSize | null>(null);
  const [state, formAction, isCreating] = useActionState<
    CreateWorkspaceState,
    FormData
  >(action, {});

  const canCreate = workspaceName.trim() !== '' && !isCreating;

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setWorkspaceName(event.target.value);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label="Workspace name"
        name="workspaceName"
        autoComplete="organization"
        placeholder="e.g., Acme Corp, Dream Team"
        required
        value={workspaceName}
        onChange={handleNameChange}
        errorMessage={state.fieldErrors?.workspaceName}
      />
      <TeamSizeOptions
        name="teamSize"
        value={teamSize}
        onChange={setTeamSize}
      />
      {state.formError && (
        <Text role="alert" variant="body-2" tone="danger">
          {state.formError}
        </Text>
      )}
      {onCancel ? (
        <DialogFooter className="pt-2">
          <Button disabled={isCreating} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="submit" variant="primary" disabled={!canCreate}>
            {submitLabel}
          </Button>
        </DialogFooter>
      ) : (
        <Button
          type="submit"
          variant="primary"
          disabled={!canCreate}
          className="mt-2 w-full"
        >
          {submitLabel}
        </Button>
      )}
    </form>
  );
}
