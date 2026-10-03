'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/atoms/button';
import { TextField } from '@/components/molecules/text-field';
import { ROUTES } from '@/lib/routes.constant';
import { type TeamSize, TeamSizeOptions } from './team-size-options';

/** Create is disabled until the Workspace has a name; a name of only spaces is no name. */
export function CreateWorkspaceForm() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState('');
  const [teamSize, setTeamSize] = useState<TeamSize | null>(null);

  const canCreate = workspaceName.trim() !== '';

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setWorkspaceName(event.target.value);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // TODO(kritpavin, #72): save the Workspace before moving on.
    event.preventDefault();
    router.push(ROUTES.register.inviteTeammates);
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
      />
      <TeamSizeOptions
        name="teamSize"
        value={teamSize}
        onChange={setTeamSize}
      />
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
