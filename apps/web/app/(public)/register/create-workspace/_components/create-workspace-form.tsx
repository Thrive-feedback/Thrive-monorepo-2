'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/atoms/button';
import { TextField } from '@/components/molecules/text-field';
import { type TeamSize, TeamSizeOptions } from './team-size-options';

/** Create is disabled until the Workspace has a name; a name of only spaces is no name. */
export function CreateWorkspaceForm() {
  const t = useTranslations('CreateWorkspace');
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
    router.push('/register/invite-teammates');
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label={t('workspaceName')}
        name="workspaceName"
        autoComplete="organization"
        placeholder={t('workspaceNamePlaceholder')}
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
        {t('create')}
      </Button>
    </form>
  );
}
