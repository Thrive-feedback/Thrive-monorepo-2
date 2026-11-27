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
import { chooseTemplateForMeeting } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting-actions.service';
import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';

export type UseTemplateDialogProps = {
  workspaceId: string;
  oneOnOneId: string;
  /** The meeting being prepared, or `null` before anybody has written to it. */
  meetingId: string | null;
  templates: readonly OneOnOneTemplate[];
  /** The template already used for it, by its key and its name, or `null` when none is. */
  current: { readonly key: string; readonly name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where focus goes once it closes: the menu it was opened from. */
  returnFocusTo: () => HTMLElement | null;
};

/** The layers a template comes from, the person's own first, as the library lists them. */
const LAYERS: readonly { scope: OneOnOneTemplateScope; heading: string }[] = [
  { scope: 'PERSONAL', heading: 'Yours' },
  { scope: 'WORKSPACE', heading: 'Your Workspace' },
  { scope: 'THRIVE', heading: 'Thrive' },
];

/**
 * Choosing a template for a meeting while it is prepared (brain ADR-0060 §8): each folded to its
 * name until opened, with Use beside it. Its questions are added to the agenda for both people, in
 * place of the last template's; what was carried over and what people added stay. Templates are
 * kept in Settings, linked from its head.
 */
export function UseTemplateDialog({
  workspaceId,
  oneOnOneId,
  meetingId,
  templates,
  current,
  open,
  onOpenChange,
  returnFocusTo,
}: UseTemplateDialogProps) {
  const [using, setUsing] = useState<string | null>(null);
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
        done: `Added ${template.name} to the agenda`,
        onSuccess: () => onOpenChange(false),
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
              {current
                ? `Replaces the questions from ${current.name}. Topics you added stay.`
                : 'Its questions are added to the agenda for you both.'}
            </DialogDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <NextLink href={ROUTES.settings.oneOnOnes}>
              <Settings2Icon aria-hidden="true" className="size-3.5" />
              Manage templates
            </NextLink>
          </Button>
        </DialogHeader>
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
                        template.key === current?.key ? (
                          <Text
                            as="span"
                            variant="label"
                            className="px-3 text-fg-accent"
                          >
                            In use
                          </Text>
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
