'use client';

import { GripVerticalIcon } from 'lucide-react';
import * as ResizablePrimitive from 'react-resizable-panels';
import { cn } from '@/lib/cn.util';

/*
 * The parts are react-resizable-panels', written as a composition:
 *
 *   <ResizablePanelGroup orientation="horizontal">
 *     <ResizablePanel defaultSize="30%">Inbox</ResizablePanel>
 *     <ResizableHandle hasGrip aria-label="Resize inbox" />
 *     <ResizablePanel>Message</ResizablePanel>
 *   </ResizablePanelGroup>
 *
 * The handle is a focusable separator: the arrow keys move it, and it announces how much of
 * the group the panel before it takes. Name each one with `aria-label`.
 */

export type ResizablePanelGroupProps = ResizablePrimitive.GroupProps;

/**
 * The library lays the panels out itself, in a row or a column by `orientation`, and fills the
 * parent: give the parent the size.
 */
export function ResizablePanelGroup(props: ResizablePanelGroupProps) {
  return (
    <ResizablePrimitive.Group data-slot="resizable-panel-group" {...props} />
  );
}

export type ResizablePanelProps = ResizablePrimitive.PanelProps;

export function ResizablePanel(props: ResizablePanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

export type ResizableHandleProps = ResizablePrimitive.SeparatorProps & {
  /** A small grip on the line, for when the line alone does not say it can be dragged. */
  hasGrip?: boolean;
};

/**
 * A one-pixel line with a wider invisible strip to grab. In a vertical group the line lies
 * flat and the grip turns with it. It takes focus, so give it an `aria-label` naming what it
 * resizes.
 */
export function ResizableHandle({
  hasGrip = false,
  className,
  ...rest
}: ResizableHandleProps) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        'relative flex w-px items-center justify-center bg-border-muted after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2 hover:bg-action-primary aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:inset-x-0 aria-[orientation=horizontal]:after:top-1/2 aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-2 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 aria-[orientation=horizontal]:*:rotate-90',
        className,
      )}
      {...rest}
    >
      {hasGrip && (
        <div className="z-10 flex h-5 w-3 items-center justify-center rounded-inner border border-border-muted bg-surface-raised text-fg-secondary">
          <GripVerticalIcon aria-hidden="true" className="size-3" />
        </div>
      )}
    </ResizablePrimitive.Separator>
  );
}
