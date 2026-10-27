'use client';

import { useState } from 'react';
import { standInPhoto } from '@/app/ui-showcase/_lib/stand-in-photo.util';
import { AvatarGroupButton } from '@/components/molecules/avatar-group-button';
import { MemberPicker } from '@/components/organisms/member-picker';
import { MemberPickerDialog } from '@/components/organisms/member-picker-dialog';
import { chosenPeople } from '@/lib/feedback/chosen-people.util';
import type { Teammate } from '@/lib/feedback/teammate.type';

/**
 * Made-up teammates: the showcase reaches no Workspace. More than four, so "+N" shows; some
 * with a drawn stand-in for a photo, some with initials only.
 */
const DEMO_TEAMMATES: readonly Teammate[] = [
  {
    accountId: 'mali',
    name: 'Mali Sombat',
    email: 'mali@brightco.example',
    photoUrl: standInPhoto('#a78bfa', '#6d28d9'),
    slug: 'mali',
    displayName: 'Mali',
  },
  {
    accountId: 'krit',
    name: 'Krit Chan',
    email: 'krit@brightco.example',
    photoUrl: null,
    slug: 'krit',
    displayName: 'Krit',
  },
  {
    accountId: 'ann',
    name: 'Ann Lee',
    email: 'ann@brightco.example',
    photoUrl: standInPhoto('#fdba74', '#ea580c'),
    slug: 'ann',
    displayName: 'Ann',
  },
  {
    accountId: 'ben',
    name: 'Ben Park',
    email: 'ben@brightco.example',
    photoUrl: null,
    slug: 'ben',
    displayName: 'Ben',
  },
  {
    accountId: 'dao',
    name: 'Dao Prasert',
    email: 'dao@brightco.example',
    photoUrl: standInPhoto('#86efac', '#15803d'),
    slug: 'dao',
    displayName: 'Dao',
  },
  {
    accountId: 'nok',
    name: 'Nok Wattana',
    email: 'nok@brightco.example',
    photoUrl: standInPhoto('#7dd3fc', '#0369a1'),
    slug: 'nok',
    displayName: 'Nok',
  },
  {
    accountId: 'chai',
    name: 'Chai Srisuk',
    email: 'chai@brightco.example',
    photoUrl: null,
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
  const chosen = chosenPeople(teammates, value);

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

/** `MemberPicker`: the same stack and dialog, choosing the one person Feedback is for. */
export function MemberPickerSingleDemo({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);

  return (
    <MemberPicker
      teammates={DEMO_TEAMMATES}
      value={value}
      onChange={setValue}
    />
  );
}
