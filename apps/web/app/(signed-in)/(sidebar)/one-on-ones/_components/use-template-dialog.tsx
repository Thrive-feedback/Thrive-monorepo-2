'use client';

import { Settings2Icon } from 'lucide-react';
import NextLink from 'next/link';
import { useState } from 'react';
import {
  TemplateCard,
  TemplateLayer,
} from '@/app/(signed-in)/(sidebar)/_components/template-card';
import type {
  OneOnOneTemplate,
  OneOnOneTemplateScope,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import { useOneOnOneAction } from '@/app/(signed-in)/(sidebar)/_lib/use-one-on-one-action';
import {
  chooseTemplateForMeeting,
  removeTemplateFromMeeting,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting-actions.service';
import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';
import { ROUTES } from '@/lib/routes.constant';

export type UseTemplateDialogProps = {
  workspaceId: string;
  oneOnOneId: string;
  /** The meeting being prepared, or `null` before anybody has written to it. */
  meetingId: string | null;
  templates: readonly OneOnOneTemplate[];
  /** The templates whose questions are on the agenda already, each by its key and its name. */
  inUse: readonly { readonly key: string; readonly name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where focus goes once it closes: the menu it was opened from. */
  returnFocusTo: () => HTMLElement | null;
  /** Told once a template's questions are on the agenda: which, by its key and name. */
  onUsed: (template: { readonly key: string; readonly name: string }) => void;
};

/** The layers a template comes from, the person's own first, as the library lists them. */
const LAYERS: readonly { scope: OneOnOneTemplateScope; heading: string }[] = [
  { scope: 'PERSONAL', heading: 'Yours' },
  { scope: 'WORKSPACE', heading: 'Your Workspace' },
  { scope: 'THRIVE', heading: 'Thrive' },
];

/**
 * Choosing a template for a meeting while it is prepared (brain ADR-0060 §8, ADR 0099): each folded
 * to its name until opened, with Use beside it. Its questions are added after the agenda's topics for
 * both people, and nothing already there goes, so several can be used. One whose questions are on the
 * agenda already offers to take them all off instead; the picker stays open, so another can be chosen
 * in its place. Templates are kept in Settings, linked from its head.
 */
export function UseTemplateDialog({
  workspaceId,
  oneOnOneId,
  meetingId,
  templates,
  inUse,
  open,
  onOpenChange,
  returnFocusTo,
  onUsed,
}: UseTemplateDialogProps) {
  const [using, setUsing] = useState<string | null>(null);
  // What was last taken off, said inside the picker, where a screen reader is while it is open.
  const [removed, setRemoved] = useState<{ name: string; times: number }>({
    name: '',
    times: 0,
  });
  const { isPending, run } = useOneOnOneAction();

  function use(template: OneOnOneTemplate) {
    setUsing(template.key);
    run(
      () =>
        chooseTemplateForMeeting(
          workspaceId,
          oneOnOneId,
          meetingId,
          template.key,
        ),
      {
        // No toast: its questions are seen landing at the foot of the agenda.
        onSuccess: () => {
          onOpenChange(false);
          onUsed({ key: template.key, name: template.name });
        },
      },
    );
  }

  function remove(template: OneOnOneTemplate) {
    if (meetingId === null) {
      return;
    }
    setUsing(template.key);
    run(
      () =>
        removeTemplateFromMeeting(
          workspaceId,
          oneOnOneId,
          meetingId,
          template.key,
        ),
      {
        onSuccess: () =>
          setRemoved((last) => ({
            name: template.name,
            times: last.times + 1,
          })),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-5 md:max-w-160"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusTo()?.focus();
        }}
      >
        <DialogHeader className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex flex-col gap-1">
            <DialogTitle>Add from template</DialogTitle>
            <DialogDescription>
              Its questions are added after the agenda’s topics, for you both.
            </DialogDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <NextLink href={ROUTES.settings.oneOnOnes}>
              <Settings2Icon aria-hidden="true" className="size-3.5" />
              Manage templates
            </NextLink>
          </Button>
        </DialogHeader>
        <p role="status" className="sr-only">
          {removed.times > 0 && (
            <span key={removed.times}>
              {`Took ${removed.name} off the agenda`}
            </span>
          )}
        </p>
        <div className="flex flex-col gap-6">
          {LAYERS.map((layer) => {
            const inLayer = templates.filter(
              (template) => template.scope === layer.scope,
            );
            if (inLayer.length === 0) {
              return null;
            }
            return (
              <TemplateLayer
                key={layer.scope}
                headingId={`use-template-${layer.scope.toLowerCase()}`}
                heading={layer.heading}
              >
                <ul className="flex flex-col divide-y divide-border-subtle">
                  {inLayer.map((template) => (
                    <TemplateCard
                      key={template.key}
                      template={template}
                      actions={
                        inUse.some((used) => used.key === template.key) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending && using !== template.key}
                            loading={isPending && using === template.key}
                            aria-label={`Remove from agenda: ${template.name}`}
                            onClick={() => remove(template)}
                          >
                            Remove from agenda
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending && using !== template.key}
                            loading={isPending && using === template.key}
                            aria-label={`Use ${template.name}`}
                            onClick={() => use(template)}
                          >
                            Use
                          </Button>
                        )
                      }
                    />
                  ))}
                </ul>
              </TemplateLayer>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
