'use client';

import { startTransition, useActionState, useState } from 'react';
import type { CreateWorkspaceState } from '@/app/(signed-in)/register/create-workspace/_lib/create-workspace-state.type';
import type { TeamSize } from '@/app/(signed-in)/register/create-workspace/_lib/team-size.constant';
import { createWorkspace } from '@/app/(signed-in)/register/create-workspace/_lib/workspace-actions.service';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { TextField } from '@/components/molecules/text-field';
import { TeamSizeOptions } from './team-size-options';

/**
 * Create is disabled until the Workspace has a name, since a name of only spaces is no name,
 * and while it is being created, so a second click cannot send it twice.
 *
 * Both fields are controlled, so what was typed and picked stays when creating fails. The
 * form is submitted by hand rather than through `action`, because React resets a form after
 * its action, which would clear the picked team size from the page but not from state.
 */
export function CreateWorkspaceForm() {
  const [workspaceName, setWorkspaceName] = useState('');
  const [teamSize, setTeamSize] = useState<TeamSize | null>(null);
  const [state, formAction, isCreating] = useActionState<
    CreateWorkspaceState,
    FormData
  >(createWorkspace, {});

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
      <Button
        type="submit"
        variant="primary"
        disabled={!canCreate}
        className="mt-2 w-full"
      >
        Create Workspace
      </Button>
    </form>
  );
}
