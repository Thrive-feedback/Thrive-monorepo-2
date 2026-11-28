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
  inUse: UseTemplateDialogProps['inUse'];
  /** Told once a template's questions are on the agenda, with its key. */
  onUsed?: (templateKey: string) => void;
};

/**
 * Add from template, beside Sync while an agenda is prepared: it opens the picker, whose head links
 * to Settings, where templates are kept. Its questions are added after the agenda's topics.
 */
export function UseTemplateButton({
  workspaceId,
  oneOnOneId,
  meetingId,
  templates,
  inUse,
  onUsed,
}: UseTemplateButtonProps) {
  const [isChoosing, setIsChoosing] = useState(false);
  // The template last put on the agenda, said once the picker has closed: there is no toast.
  const [used, setUsed] = useState<{ name: string; times: number }>({
    name: '',
    times: 0,
  });
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
        inUse={inUse}
        open={isChoosing}
        onOpenChange={setIsChoosing}
        returnFocusTo={() => button.current}
        onUsed={(template) => {
          setUsed((last) => ({ name: template.name, times: last.times + 1 }));
          onUsed?.(template.key);
        }}
      />
      <span role="status" className="sr-only">
        {used.times > 0 && (
          <span key={used.times}>{`Added ${used.name} to the agenda`}</span>
        )}
      </span>
    </>
  );
}
