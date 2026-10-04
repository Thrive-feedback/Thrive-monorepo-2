'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/atoms/button';
import { TextField } from '@/components/molecules/text-field';

function firstWord(value: string): string {
  return value.trim().split(/\s+/)[0] ?? '';
}

/**
 * Display name follows the first word of Full name until the person types in Display name;
 * from then on it is theirs, even if they clear it.
 */
export function IntroduceYourselfForm() {
  const t = useTranslations('IntroduceYourself');
  const router = useRouter();
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
    // TODO(kritpavin, #71): save the Profile before moving on.
    event.preventDefault();
    router.push('/register/create-workspace');
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label={t('fullName')}
        name="fullName"
        autoComplete="name"
        placeholder={t('fullNamePlaceholder')}
        required
        value={fullName}
        onChange={handleFullNameChange}
      />
      <TextField
        label={t('displayName')}
        name="displayName"
        autoComplete="nickname"
        placeholder={t('displayNamePlaceholder')}
        helperText={t('displayNameHelp')}
        required
        value={displayName}
        onChange={handleDisplayNameChange}
      />
      <Button
        type="submit"
        variant="primary"
        disabled={!canContinue}
        className="mt-2 w-full"
      >
        {t('saveAndContinue')}
      </Button>
    </form>
  );
}
