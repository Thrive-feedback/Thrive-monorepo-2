'use client';

import { LayoutTemplateIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import type { OneOnOneTemplate } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import {
  UseTemplateDialog,
  type UseTemplateDialogProps,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/use-template-dialog';
import { Button } from '@/components/atoms/button';

export type UseTemplateButtonProps = {
  workspaceId: string;
  oneOnOneId: string;
  /** The meeting being prepared, or `null` before anybody has written to it. */
  meetingId: string | null;
  templates: readonly OneOnOneTemplate[];
  current: UseTemplateDialogProps['current'];
};

/**
 * Add from template, beside Sync while an agenda is prepared: it opens the picker, whose head links
 * to Settings, where templates are kept. Its questions take the place of the last template's.
 */
export function UseTemplateButton({
  workspaceId,
  oneOnOneId,
  meetingId,
  templates,
  current,
}: UseTemplateButtonProps) {
  const [isChoosing, setIsChoosing] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button
        ref={button}
        variant="ghost"
        size="sm"
        prefixIcon={
          <LayoutTemplateIcon aria-hidden="true" className="size-3.5" />
        }
        onClick={() => setIsChoosing(true)}
      >
        Add from template
      </Button>
      <UseTemplateDialog
        workspaceId={workspaceId}
        oneOnOneId={oneOnOneId}
        meetingId={meetingId}
        templates={templates}
        current={current}
        open={isChoosing}
        onOpenChange={setIsChoosing}
        returnFocusTo={() => button.current}
      />
    </>
  );
}
