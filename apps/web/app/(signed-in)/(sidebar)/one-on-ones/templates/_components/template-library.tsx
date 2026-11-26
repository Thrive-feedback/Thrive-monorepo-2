'use client';

import { CopyIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useRef, useState } from 'react';
import type {
  OneOnOneTemplate,
  OneOnOneTemplateCatalog,
  OneOnOneTemplateScope,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import {
  copyOf,
  draftOf,
  EMPTY_DRAFT,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-template.util';
import {
  keepOneOnOneTemplate,
  removeOneOnOneTemplate,
  rewriteOneOnOneTemplate,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-template-actions.service';
import { useOneOnOneAction } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/use-one-on-one-action';
import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/dialog';
import { Text } from '@/components/atoms/text';
import { TemplateDialog } from './template-dialog';

export type TemplateLibraryProps = {
  workspaceId: string;
  workspaceName: string;
  catalog: OneOnOneTemplateCatalog;
};

type Layer = {
  readonly scope: OneOnOneTemplateScope;
  readonly heading: string;
  readonly about: string;
  readonly empty: string;
};

/** The three layers, the person's own first: what they shape most is what they come here for. */
function layersFor(
  workspaceName: string,
  mayKeepForWorkspace: boolean,
): readonly Layer[] {
  return [
    {
      scope: 'PERSONAL',
      heading: 'Yours',
      about:
        'Only you see these. Start any 1:1 you’re in from one, and the other person sees its questions on the agenda.',
      empty:
        'Nothing of your own yet. Copy one below to change it, or start a new one.',
    },
    {
      scope: 'WORKSPACE',
      heading: `${workspaceName}’s`,
      about: mayKeepForWorkspace
        ? `Everyone in ${workspaceName} can start from these. You’re an Admin, so you can change them.`
        : `Everyone in ${workspaceName} can start from these. Admins change them.`,
      empty: mayKeepForWorkspace
        ? `${workspaceName} keeps none yet. Make one for everyone with New template.`
        : `${workspaceName} keeps none yet.`,
    },
    {
      scope: 'THRIVE',
      heading: 'Thrive’s',
      about: 'Ready to use as they are. Copy one to make it your own.',
      empty: '',
    },
  ];
}

/** Asks before a template is removed, saying what happens to the 1:1s starting from it. */
function RemoveTemplate({
  workspaceId,
  template,
  layerHeadingId,
}: {
  workspaceId: string;
  template: OneOnOneTemplate;
  /** Where focus goes once the template is gone, taking its Remove button with it. */
  layerHeadingId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const { isPending, run } = useOneOnOneAction();
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          ref={opener}
          variant="ghost-danger"
          size="sm"
          prefixIcon={<Trash2Icon aria-hidden="true" className="size-4" />}
          aria-label={`Remove ${template.name}`}
        >
          Remove
        </Button>
      </DialogTrigger>
      <DialogContent
        className="gap-5"
        onCloseAutoFocus={(event) => {
          // Kept, focus returns to Remove; removed, the card is gone, so its layer takes focus.
          event.preventDefault();
          const back = opener.current?.isConnected
            ? opener.current
            : document.getElementById(layerHeadingId);
          back?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>Remove “{template.name}”?</DialogTitle>
          <DialogDescription>
            Nobody can choose it again. 1:1s that already start from it keep its
            questions until someone picks another.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={() => setIsOpen(false)}
          >
            Keep it
          </Button>
          <Button
            variant="danger"
            loading={isPending}
            onClick={() =>
              run(() => removeOneOnOneTemplate(workspaceId, template.key), {
                done: 'Template removed',
                onSuccess: () => setIsOpen(false),
              })
            }
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** One template as a card: its name, when to use it, its questions in order, and what the person may do. */
function TemplateCard({
  workspaceId,
  workspaceName,
  mayKeepForWorkspace,
  template,
  layerHeadingId,
}: {
  workspaceId: string;
  workspaceName: string;
  mayKeepForWorkspace: boolean;
  template: OneOnOneTemplate;
  layerHeadingId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const kept = template.scope === 'THRIVE' ? null : template.scope;
  return (
    <li className="flex flex-col gap-4 rounded-control border border-border-muted px-5 pt-5 pb-3">
      <div className="flex min-w-0 flex-col gap-1">
        <Text as="h3" variant="subtitle-3">
          {template.name}
        </Text>
        {template.suggestedWhen && (
          <Text as="p" variant="body-3" tone="muted">
            {template.suggestedWhen}
          </Text>
        )}
        <ol className="mt-2 flex list-decimal flex-col gap-1 ps-5 marker:text-fg-muted">
          {/* A template never asks one question twice (the API refuses it), so each is its own key. */}
          {template.questions.map((question) => (
            <li key={question}>
              <Text as="span" variant="body-2">
                {question}
              </Text>
            </li>
          ))}
        </ol>
      </div>
      <div className="-ms-1.25 mt-auto flex flex-wrap gap-1">
        {template.changeable && kept && (
          <TemplateDialog
            open={isEditing}
            onOpenChange={setIsEditing}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                prefixIcon={
                  <PencilIcon aria-hidden="true" className="size-4" />
                }
                aria-label={`Edit ${template.name}`}
              >
                Edit
              </Button>
            }
            title={`Edit “${template.name}”`}
            description="Agendas opened from it from now on use what it says. One already open keeps its questions."
            initial={draftOf(template)}
            scope={kept}
            submitLabel="Save"
            done="Template saved"
            onSubmit={(draft) =>
              rewriteOneOnOneTemplate(workspaceId, template.key, draft)
            }
          />
        )}
        <TemplateDialog
          open={isCopying}
          onOpenChange={setIsCopying}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              prefixIcon={<CopyIcon aria-hidden="true" className="size-4" />}
              aria-label={`Copy ${template.name}`}
            >
              Copy
            </Button>
          }
          title={`Copy “${template.name}”`}
          description="Change the copy however you like. The original stays as it is."
          initial={(scope) => copyOf(template, { sameLayer: kept === scope })}
          scope="PERSONAL"
          chooseScope={mayKeepForWorkspace ? { workspaceName } : undefined}
          submitLabel="Save copy"
          done="Copy saved"
          onSubmit={(draft, scope) =>
            keepOneOnOneTemplate(workspaceId, scope, draft)
          }
        />
        {template.changeable && (
          <RemoveTemplate
            workspaceId={workspaceId}
            template={template}
            layerHeadingId={layerHeadingId}
          />
        )}
      </div>
    </li>
  );
}

export type NewTemplateProps = {
  workspaceId: string;
  workspaceName: string;
  mayKeepForWorkspace: boolean;
};

/** Starting a template from nothing: the person's own, or, for an Admin, everyone's. */
export function NewTemplate({
  workspaceId,
  workspaceName,
  mayKeepForWorkspace,
}: NewTemplateProps) {
  const [isCreating, setIsCreating] = useState(false);
  return (
    <TemplateDialog
      open={isCreating}
      onOpenChange={setIsCreating}
      trigger={
        <Button
          variant="primary"
          prefixIcon={<PlusIcon aria-hidden="true" className="size-4" />}
        >
          New template
        </Button>
      }
      title="A new template"
      description="The questions each agenda opens with, in order. Either person can still add, reorder and remove topics."
      initial={EMPTY_DRAFT}
      scope="PERSONAL"
      chooseScope={mayKeepForWorkspace ? { workspaceName } : undefined}
      submitLabel="Save template"
      done="Template saved"
      onSubmit={(draft, scope) =>
        keepOneOnOneTemplate(workspaceId, scope, draft)
      }
    />
  );
}

/**
 * Every template a 1:1 can start from, in its three layers: the person's own, which only they see;
 * the Workspace's, which everyone uses and Admins change; and Thrive's, ready as they are. Any one
 * can be copied to become the person's own.
 */
export function TemplateLibrary({
  workspaceId,
  workspaceName,
  catalog,
}: TemplateLibraryProps) {
  const { mayKeepForWorkspace } = catalog;
  return (
    <>
      {layersFor(workspaceName, mayKeepForWorkspace).map((layer) => {
        const templates = catalog.items.filter(
          (template) => template.scope === layer.scope,
        );
        const headingId = `templates-${layer.scope.toLowerCase()}`;
        return (
          <section
            key={layer.scope}
            aria-labelledby={headingId}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-1">
              {/* Takes focus when the template removed from it was the one focus came from. */}
              <Text
                as="h2"
                id={headingId}
                tabIndex={-1}
                variant="subtitle-2"
                className="focus-visible:outline-2 focus-visible:outline-action-primary"
              >
                {layer.heading}
              </Text>
              <Text as="p" variant="body-2" tone="muted">
                {layer.about}
              </Text>
            </div>
            {templates.length === 0 ? (
              <Text
                as="p"
                variant="body-2"
                tone="muted"
                className="rounded-control border border-border-muted border-dashed px-4 py-5"
              >
                {layer.empty}
              </Text>
            ) : (
              <ul className="grid gap-4 lg:grid-cols-2">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.key}
                    workspaceId={workspaceId}
                    workspaceName={workspaceName}
                    mayKeepForWorkspace={mayKeepForWorkspace}
                    template={template}
                    layerHeadingId={headingId}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}
