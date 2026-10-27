'use client';

import { useState } from 'react';
import { AvatarGroupButton } from '@/components/molecules/avatar-group-button';
import { MemberPickerDialog } from '@/components/organisms/member-picker-dialog';
import type { Teammate } from '@/lib/feedback/teammate.type';

/** Made-up teammates: the showcase reaches no Workspace. More than four, so "+N" shows. */
const DEMO_TEAMMATES: readonly Teammate[] = [
  {
    accountId: 'mali',
    name: 'Mali Sombat',
    email: 'mali@brightco.example',
    slug: 'mali',
    displayName: 'Mali',
  },
  {
    accountId: 'krit',
    name: 'Krit Chan',
    email: 'krit@brightco.example',
    slug: 'krit',
    displayName: 'Krit',
  },
  {
    accountId: 'ann',
    name: 'Ann Lee',
    email: 'ann@brightco.example',
    slug: 'ann',
    displayName: 'Ann',
  },
  {
    accountId: 'ben',
    name: 'Ben Park',
    email: 'ben@brightco.example',
    slug: 'ben',
    displayName: 'Ben',
  },
  {
    accountId: 'dao',
    name: 'Dao Prasert',
    email: 'dao@brightco.example',
    slug: 'dao',
    displayName: 'Dao',
  },
  {
    accountId: 'nok',
    name: 'Nok Wattana',
    email: 'nok@brightco.example',
    slug: 'nok',
    displayName: 'Nok',
  },
  {
    accountId: 'chai',
    name: 'Chai Srisuk',
    email: 'chai@brightco.example',
    slug: null,
    displayName: null,
  },
];

/** `MemberPickerDialog` opened from an `AvatarGroupButton`, the way every form pairs them. */
export function MemberPickerDemo({
  teammates = DEMO_TEAMMATES,
  initial = [],
}: {
  teammates?: readonly Teammate[];
  initial?: readonly string[];
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initial);
  const chosen = value.flatMap((accountId) => {
    const teammate = teammates.find((one) => one.accountId === accountId);
    return teammate ? [{ id: teammate.accountId, name: teammate.name }] : [];
  });

  return (
    <>
      <AvatarGroupButton
        people={chosen}
        label="Choose who to ask"
        onClick={() => setOpen(true)}
      />
      <MemberPickerDialog
        teammates={teammates}
        value={value}
        title="Choose who to ask"
        description="They each answer in their own words."
        open={open}
        onOpenChange={setOpen}
        onDone={setValue}
      />
    </>
  );
}
