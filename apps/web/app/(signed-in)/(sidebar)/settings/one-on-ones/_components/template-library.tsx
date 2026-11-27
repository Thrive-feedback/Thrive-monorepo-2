'use client';

import {
  CopyIcon,
  EllipsisIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { TemplateCard } from '@/app/(signed-in)/(sidebar)/_components/template-card';
import type {
  OneOnOneTemplate,
  OneOnOneTemplateCatalog,
  OneOnOneTemplateScope,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import { useOneOnOneAction } from '@/app/(signed-in)/(sidebar)/_lib/use-one-on-one-action';
import { SettingsCard } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-card';
import {
  copyOf,
  draftOf,
  EMPTY_DRAFT,
} from '@/app/(signed-in)/(sidebar)/settings/one-on-ones/_lib/one-on-one-template.util';
import {
  keepOneOnOneTemplate,
  removeOneOnOneTemplate,
  rewriteOneOnOneTemplate,
} from '@/app/(signed-in)/(sidebar)/settings/one-on-ones/_lib/one-on-one-template-actions.service';
import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { Text } from '@/components/atoms/text';
import { type KeptScope, TemplateDialog } from './template-dialog';

export type TemplateLibraryProps = {
  workspaceId: string;
  workspaceName: string;
  catalog: OneOnOneTemplateCatalog;
};

type Layer = {
  readonly scope: OneOnOneTemplateScope;
  readonly heading: string;
  /** Who sees and changes them, under the heading. */
  readonly about: string;
  readonly empty: string;
  /** Who a new one started from this card is for, where the person may start one here. */
  readonly startsNew: KeptScope | null;
};

/** The three layers, each its own card, the person's own first: what they shape most is what they come here for. */
function layersFor(
  workspaceName: string,
  mayKeepForWorkspace: boolean,
): readonly Layer[] {
  return [
    {
      scope: 'PERSONAL',
      heading: 'Your templates',
      about: 'Only you see these.',
      empty: 'None yet. Copy one below, or start a new one.',
      startsNew: 'PERSONAL',
    },
    {
      scope: 'WORKSPACE',
      heading: `${workspaceName}’s templates`,
      about: mayKeepForWorkspace
        ? 'Everyone can use these. As an Admin, you can change them.'
        : 'Everyone can use these. Admins change them.',
      empty: mayKeepForWorkspace
        ? 'None yet. A new one here is for everyone.'
        : 'None yet.',
      startsNew: mayKeepForWorkspace ? 'WORKSPACE' : null,
    },
    {
      scope: 'THRIVE',
      heading: 'Thrive’s templates',
      about: 'Ready to use. Copy one to make it your own.',
      empty: '',
      startsNew: null,
    },
  ];
}

/** Asks before a template is removed, saying what happens to the meetings that used it. */
function RemoveTemplate({
  workspaceId,
  template,
  open,
  onOpenChange,
  returnFocusTo,
}: {
  workspaceId: string;
  template: OneOnOneTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The menu's button while the row is there; once the template is gone, its layer. */
  returnFocusTo: () => HTMLElement | null;
}) {
  const { isPending, run } = useOneOnOneAction();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-5"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          // Chosen a frame later: the page read again as the template went may not have taken its
          // row away yet, and focus given to the row's button would be lost with it.
          requestAnimationFrame(() => returnFocusTo()?.focus());
        }}
      >
        <DialogHeader>
          <DialogTitle>Remove “{template.name}”?</DialogTitle>
          <DialogDescription>
            Nobody can use it again. Meetings that already used it keep its
            questions.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Keep it
          </Button>
          <Button
            variant="danger"
            loading={isPending}
            onClick={() =>
              run(() => removeOneOnOneTemplate(workspaceId, template.key), {
                done: 'Template removed',
                onSuccess: () => onOpenChange(false),
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

/**
 * What the person may do with one template, behind one quiet menu so a long list reads as names:
 * Edit and Remove where they may change it, and Copy everywhere. Each opens its own dialog.
 */
function TemplateActions({
  workspaceId,
  workspaceName,
  mayKeepForWorkspace,
  template,
  layerHeading,
}: {
  workspaceId: string;
  workspaceName: string;
  mayKeepForWorkspace: boolean;
  template: OneOnOneTemplate;
  /** The title of the card it is in, which takes focus once the template is gone. */
  layerHeading: () => HTMLElement | null;
}) {
  const [open, setOpen] = useState<'edit' | 'copy' | 'remove' | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const kept = template.scope === 'THRIVE' ? null : template.scope;
  // The menu's item is gone once its dialog opens, so focus goes back to the menu's button; once the
  // template itself is gone, to its layer.
  const back = () =>
    menuButton.current?.isConnected ? menuButton.current : layerHeading();
  const openChange = (which: 'edit' | 'copy' | 'remove') => (next: boolean) =>
    setOpen(next ? which : null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={menuButton}
            variant="ghost"
            size="icon"
            aria-label={`Manage ${template.name}`}
          >
            <EllipsisIcon aria-hidden="true" className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {template.changeable && kept && (
            <DropdownMenuItem onSelect={() => setOpen('edit')}>
              <PencilIcon aria-hidden="true" className="size-4" />
              Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setOpen('copy')}>
            <CopyIcon aria-hidden="true" className="size-4" />
            Copy
          </DropdownMenuItem>
          {template.changeable && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                tone="danger"
                onSelect={() => setOpen('remove')}
              >
                <Trash2Icon aria-hidden="true" className="size-4" />
                Remove
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {template.changeable && kept && (
        <TemplateDialog
          open={open === 'edit'}
          onOpenChange={openChange('edit')}
          returnFocusTo={back}
          title={`Edit “${template.name}”`}
          description="Meetings that use it from now on get what it says. One that already used it keeps its questions."
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
        open={open === 'copy'}
        onOpenChange={openChange('copy')}
        returnFocusTo={back}
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
          open={open === 'remove'}
          onOpenChange={openChange('remove')}
          returnFocusTo={back}
        />
      )}
    </>
  );
}

export type NewTemplateProps = {
  workspaceId: string;
  workspaceName: string;
  mayKeepForWorkspace: boolean;
  /** Who it is for to start with: the card it was started from. */
  scope: KeptScope;
};

/**
 * Starting a template from nothing, from the end of a card's title as Invite people is on
 * Teammates: the person's own, or, for an Admin, everyone's.
 */
export function NewTemplate({
  workspaceId,
  workspaceName,
  mayKeepForWorkspace,
  scope,
}: NewTemplateProps) {
  const [isCreating, setIsCreating] = useState(false);
  return (
    <TemplateDialog
      open={isCreating}
      onOpenChange={setIsCreating}
      trigger={
        <Button
          variant="outlined"
          size="sm"
          className="shrink-0"
          aria-label={
            scope === 'WORKSPACE'
              ? `New template for everyone in ${workspaceName}`
              : undefined
          }
        >
          <PlusIcon aria-hidden="true" className="size-4" />
          New template
        </Button>
      }
      title="A new template"
      description="The questions a meeting gets when someone uses it, in order. Either person can still add, reorder and remove topics."
      initial={EMPTY_DRAFT}
      scope={scope}
      chooseScope={mayKeepForWorkspace ? { workspaceName } : undefined}
      submitLabel="Save template"
      done="Template saved"
      onSubmit={(draft, chosen) =>
        keepOneOnOneTemplate(workspaceId, chosen, draft)
      }
    />
  );
}

/** One layer's card: its templates as rows, or a line saying there are none yet. */
function LayerCard({
  layer,
  templates,
  workspaceId,
  workspaceName,
  mayKeepForWorkspace,
}: {
  layer: Layer;
  templates: readonly OneOnOneTemplate[];
  workspaceId: string;
  workspaceName: string;
  mayKeepForWorkspace: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  return (
    <SettingsCard
      title={layer.heading}
      description={layer.about}
      titleRef={heading}
      action={
        layer.startsNew && (
          <NewTemplate
            workspaceId={workspaceId}
            workspaceName={workspaceName}
            mayKeepForWorkspace={mayKeepForWorkspace}
            scope={layer.startsNew}
          />
        )
      }
    >
      {templates.length === 0 ? (
        <Text as="p" variant="body-3" tone="muted" className="py-4">
          {layer.empty}
        </Text>
      ) : (
        <ul className="flex flex-col divide-y divide-border-subtle py-2">
          {templates.map((template) => (
            <TemplateCard
              key={template.key}
              template={template}
              actions={
                <TemplateActions
                  workspaceId={workspaceId}
                  workspaceName={workspaceName}
                  mayKeepForWorkspace={mayKeepForWorkspace}
                  template={template}
                  layerHeading={() => heading.current}
                />
              }
            />
          ))}
        </ul>
      )}
    </SettingsCard>
  );
}

/**
 * Every template a meeting can use, a card for each of its three layers, as the other Settings
 * sections are drawn: the person's own, which only they see; the Workspace's, which everyone uses
 * and Admins change; and Thrive's, ready as they are. Each template is a row of its name and when
 * to use it, opened to its questions, with its actions in one menu.
 */
export function TemplateLibrary({
  workspaceId,
  workspaceName,
  catalog,
}: TemplateLibraryProps) {
  const { mayKeepForWorkspace } = catalog;
  return (
    <>
      {layersFor(workspaceName, mayKeepForWorkspace).map((layer) => (
        <LayerCard
          key={layer.scope}
          layer={layer}
          templates={catalog.items.filter(
            (template) => template.scope === layer.scope,
          )}
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          mayKeepForWorkspace={mayKeepForWorkspace}
        />
      ))}
    </>
  );
}
