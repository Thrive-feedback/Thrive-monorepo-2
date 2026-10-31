'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { LETTER_TEAMMATES } from '@/app/ui-showcase/letter/_components/letter-teammates.mock';
import { Button } from '@/components/atoms/button';
import { KudosDialog } from '@/components/organisms/kudos-dialog/kudos-dialog';

const SAMPLE_WORKSPACE_GOALS = ['Ownership', 'CustomerFirst'];

/**
 * Client-only because the dialog is opened from a button here. Send only says it went: the showcase
 * reaches no Workspace.
 */
export function KudosDialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Give kudos
      </Button>
      <KudosDialog
        title="Give kudos"
        teammates={LETTER_TEAMMATES}
        workspaceGoals={SAMPLE_WORKSPACE_GOALS}
        open={open}
        onOpenChange={setOpen}
        onSend={async () => {
          toast.success('Kudos sent.');
          return true;
        }}
      />
    </>
  );
}
