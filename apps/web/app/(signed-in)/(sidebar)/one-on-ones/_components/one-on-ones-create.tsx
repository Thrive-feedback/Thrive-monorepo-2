'use client';

import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import type { OneOnOneTemplate } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import { Button } from '@/components/atoms/button';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { CreateOneOnOneDialog } from './create-one-on-one-dialog';

export type OneOnOnesCreateProps = {
  workspaceId: string;
  teammates: readonly Teammate[];
  templates: readonly OneOnOneTemplate[];
  /** Teammates the person already has a 1:1 with, as `[accountId, reason]`. */
  unavailable: readonly (readonly [string, string])[];
};

/** The one way a 1:1 begins, at the head of the page, in the product's plum. */
export function OneOnOnesCreate({
  workspaceId,
  teammates,
  templates,
  unavailable,
}: OneOnOnesCreateProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <CreateOneOnOneDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      workspaceId={workspaceId}
      teammates={teammates}
      templates={templates}
      unavailable={new Map(unavailable)}
      trigger={
        <Button variant="primary" prefixIcon={<PlusIcon aria-hidden="true" />}>
          Create 1:1
        </Button>
      }
    />
  );
}
