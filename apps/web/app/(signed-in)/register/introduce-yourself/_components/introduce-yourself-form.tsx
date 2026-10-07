'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { TextField } from '@/components/molecules/text-field';
import { saveProfile } from '../_lib/profile-actions.service';
import type { SaveProfileState } from '../_lib/save-profile-state.type';

function firstWord(value: string): string {
  return value.trim().split(/\s+/)[0] ?? '';
}

export type IntroduceYourselfFormProps = {
  /** Where Full name starts, such as the name Google gave. Display name starts from it too. */
  defaultFullName?: string;
};

/**
 * Display name follows the first word of Full name until the person types in Display name;
 * from then on it is theirs, even if they clear it.
 *
 * Both fields are controlled, so what was typed stays when saving fails.
 */
export function IntroduceYourselfForm({
  defaultFullName = '',
}: IntroduceYourselfFormProps) {
  const [fullName, setFullName] = useState(defaultFullName);
  const [displayName, setDisplayName] = useState(firstWord(defaultFullName));
  const [isDisplayNameEdited, setIsDisplayNameEdited] = useState(false);
  const [state, formAction, isSaving] = useActionState<
    SaveProfileState,
    FormData
  >(saveProfile, {});

  const canContinue =
    fullName.trim() !== '' && displayName.trim() !== '' && !isSaving;

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

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField
        label="Full Name"
        name="fullName"
        autoComplete="name"
        placeholder="Enter your name"
        required
        value={fullName}
        onChange={handleFullNameChange}
        errorMessage={state.fieldErrors?.fullName}
      />
      <TextField
        label="What should we call you?"
        name="displayName"
        autoComplete="nickname"
        placeholder="e.g. Ton, P'Mod, Tony"
        helperText="This is how your name will show up in the system."
        required
        value={displayName}
        onChange={handleDisplayNameChange}
        errorMessage={state.fieldErrors?.displayName}
      />
      {state.formError && (
        <Text role="alert" variant="body-2" tone="danger">
          {state.formError}
        </Text>
      )}
      <Button
        type="submit"
        variant="primary"
        disabled={!canContinue}
        className="mt-2 w-full"
      >
        Save &amp; Continue
      </Button>
    </form>
  );
}
