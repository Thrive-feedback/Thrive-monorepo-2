'use client';

import { useState } from 'react';
import type { Teammate } from '@/app/(signed-in)/(member)/home/_lib/teammate.type';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/atoms/tabs';
import { GiveFeedbackForm } from './give-feedback-form';
import { RequestFeedbackForm } from './request-feedback-form';

export type FeedbackComposerProps = {
  teammates: readonly Teammate[];
};

/**
 * One form, two modes: ask a teammate for Feedback, or give it without being asked — the two
 * moments `ADR-0022` holds equally important. The mode is not in the URL: it is a choice made
 * on the way to writing, not a place to come back to. Radix unmounts an inactive panel, which
 * would drop what was typed, so both panels stay mounted and the inactive one is hidden.
 */
export function FeedbackComposer({ teammates }: FeedbackComposerProps) {
  const [mode, setMode] = useState('request');

  return (
    <Tabs value={mode} onValueChange={setMode}>
      <TabsList aria-label="Feedback form">
        <TabsTrigger value="request">Request feedback</TabsTrigger>
        <TabsTrigger value="give">Give feedback</TabsTrigger>
      </TabsList>
      <TabsContent value="request" forceMount hidden={mode !== 'request'}>
        <RequestFeedbackForm teammates={teammates} />
      </TabsContent>
      <TabsContent value="give" forceMount hidden={mode !== 'give'}>
        <GiveFeedbackForm teammates={teammates} />
      </TabsContent>
    </Tabs>
  );
}
