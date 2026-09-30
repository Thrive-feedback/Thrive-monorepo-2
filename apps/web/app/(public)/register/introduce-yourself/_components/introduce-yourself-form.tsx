'use client';

import { useState } from 'react';
import { Button } from '@/components/atoms/button';
import { TextField } from './text-field';

function firstWord(value: string): string {
  return value.trim().split(/\s+/)[0] ?? '';
}

/**
 * Display name follows the first word of Full name until the person types in Display name;
 * from then on it is theirs, even if they clear it.
 */
export function IntroduceYourselfForm() {
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isDisplayNameEdited, setIsDisplayNameEdited] = useState(false);

  const canContinue = fullName.trim() !== '' && displayName.trim() !== '';

  function handleFullNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFullName(event.target.value);
    if (!isDisplayNameEdited) {
      setDisplayName(firstWord(event.target.value));
    }
  }

  function handleDisplayNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setIsDisplayNameEdited(true);
    setDisplayName(event.target.value);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // TODO(kritpavin, #71): save the Profile and move on to Create a Workspace.
    event.preventDefault();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label="Full Name"
        name="fullName"
        autoComplete="name"
        placeholder="Enter your name"
        required
        value={fullName}
        onChange={handleFullNameChange}
      />
      <TextField
        label="What should we call you?"
        name="displayName"
        autoComplete="nickname"
        placeholder="e.g. Ton, P'Mod, Tony"
        helperText="This will appear on your desk and Kudo cards."
        required
        value={displayName}
        onChange={handleDisplayNameChange}
      />
      <Button
        type="submit"
        tone="primary"
        disabled={!canContinue}
        className="mt-2 w-full"
      >
        Save &amp; Continue
      </Button>
    </form>
  );
}
