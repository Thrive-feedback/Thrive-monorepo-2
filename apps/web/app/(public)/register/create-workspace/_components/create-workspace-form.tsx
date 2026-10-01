'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/atoms/button';
import { TextField } from '@/components/molecules/text-field';
import { type TeamSize, TeamSizeOptions } from './team-size-options';

/**
 * Create stays enabled so pressing it with no name says why it was refused. `noValidate` lets
 * that message show in the field instead of the browser's own tooltip.
 */
export function CreateWorkspaceForm() {
  const nameRef = useRef<HTMLInputElement>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [teamSize, setTeamSize] = useState<TeamSize | null>(null);
  const [isNameMissing, setIsNameMissing] = useState(false);

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setWorkspaceName(event.target.value);
    setIsNameMissing(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (workspaceName.trim() === '') {
      setIsNameMissing(true);
      nameRef.current?.focus();
      return;
    }
    // TODO(kritpavin, #63): move on to Invite your team. Saving the Workspace is #72.
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <TextField
        ref={nameRef}
        label="Workspace name"
        name="workspaceName"
        autoComplete="organization"
        placeholder="e.g., Acme Corp, Dream Team"
        required
        value={workspaceName}
        onChange={handleNameChange}
        errorMessage={isNameMissing ? 'Give your Workspace a name.' : undefined}
      />
      <TeamSizeOptions
        name="teamSize"
        value={teamSize}
        onChange={setTeamSize}
      />
      <Button type="submit" variant="primary" className="mt-2 w-full">
        Create Workspace
      </Button>
    </form>
  );
}
