'use client';

import { useState } from 'react';
import { AutocompleteInput } from '@/components/molecules/autocomplete-input';
import { AutocompleteTextarea } from '@/components/molecules/autocomplete-textarea';
import type { AutocompleteTrigger } from '@/components/molecules/use-tag-autocomplete';
import {
  HASHTAG_RULE,
  MENTION_RULE,
} from '@/lib/feedback/text-tag-rules.constant';

/** Made-up tags for the showcase: three goals and two people, one with a Thai name. */
export const DEMO_TRIGGERS: readonly AutocompleteTrigger[] = [
  {
    rule: HASHTAG_RULE,
    label: 'Goals',
    tone: 'accent',
    options: ['ownership', 'customer-first', 'ลูกค้ามาก่อน'].map((name) => ({
      value: name,
      label: `#${name}`,
      keywords: [name],
    })),
  },
  {
    rule: MENTION_RULE,
    label: 'People',
    tone: 'secondary',
    options: [
      {
        value: 'nok',
        label: 'Nok',
        keywords: ['Nok', 'Nok Chaiyo', 'nok'],
      },
      {
        value: 'somchai.k',
        label: 'สมชาย',
        keywords: ['สมชาย', 'Somchai Kaewmanee', 'somchai.k'],
      },
    ],
  },
];

/** Client-only because completing a tag needs the value held in state. */
export function AutocompleteTextareaDemo({
  initial = '',
  disabled = false,
}: {
  initial?: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <AutocompleteTextarea
      aria-label="Feedback"
      placeholder="Type # or @"
      value={value}
      disabled={disabled}
      triggers={DEMO_TRIGGERS}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

/** Client-only because completing a tag needs the value held in state. */
export function AutocompleteInputDemo({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <AutocompleteInput
      aria-label="Request message"
      placeholder="Type # or @"
      value={value}
      triggers={DEMO_TRIGGERS}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}
