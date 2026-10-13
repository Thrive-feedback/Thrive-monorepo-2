import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/atoms/resizable';

function Pane({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex size-full items-center justify-center p-4 text-body-2 text-fg-secondary">
      {children}
    </div>
  );
}

export function ResizableEntry() {
  return (
    <ShowcaseEntry
      name="Resizable"
      level="atom"
      origin="shadcn"
      source="components/atoms/resizable.tsx — ResizablePanelGroup, ResizablePanel, ResizableHandle"
      summary="Panels side by side or stacked, with a line between them that can be dragged."
      useFor="Two views someone works across at once and wants to balance: a list and the item open beside it."
      avoidFor="A layout that should simply respond to the screen width. Use the breakpoints."
      usage={`import {
  ResizableHandle, ResizablePanel, ResizablePanelGroup,
} from '@/components/atoms/resizable';

<ResizablePanelGroup orientation="horizontal">
  <ResizablePanel defaultSize="30%" minSize="20%">Inbox</ResizablePanel>
  <ResizableHandle hasGrip aria-label="Resize inbox" />
  <ResizablePanel>Message</ResizablePanel>
</ResizablePanelGroup>`}
      props={[
        {
          name: 'orientation',
          type: "'horizontal' | 'vertical'",
          defaultValue: "'horizontal'",
          description: 'On ResizablePanelGroup: side by side, or stacked.',
        },
        {
          name: 'defaultSize / minSize / maxSize',
          type: 'string | number',
          description:
            'On ResizablePanel: its size. Write a share as a string ("40%"); a bare number is pixels.',
        },
        {
          name: 'hasGrip',
          type: 'boolean',
          defaultValue: 'false',
          description: 'On ResizableHandle: a small grip on the line.',
        },
        {
          name: 'aria-label',
          type: 'string',
          description:
            'On ResizableHandle: what it resizes, since it takes focus.',
        },
      ]}
      accessibility={[
        'The handle is a separator that takes focus with Tab and moves with the arrow keys.',
        'It announces how much of the group the panel before it takes.',
        'Name each handle with aria-label, for what it resizes: "Resize list".',
      ]}
    >
      <StateCell label="Side by side, with a grip">
        <div className="h-40 w-full overflow-hidden rounded-container border border-border-muted">
          <ResizablePanelGroup orientation="horizontal">
            <ResizablePanel defaultSize="40%" minSize="20%">
              <Pane>List</Pane>
            </ResizablePanel>
            <ResizableHandle hasGrip aria-label="Resize list" />
            <ResizablePanel minSize="20%">
              <Pane>Detail</Pane>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </StateCell>
      <StateCell label="Stacked">
        <div className="h-48 w-full overflow-hidden rounded-container border border-border-muted">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize="50%" minSize="20%">
              <Pane>Top</Pane>
            </ResizablePanel>
            <ResizableHandle hasGrip aria-label="Resize top" />
            <ResizablePanel minSize="20%">
              <Pane>Bottom</Pane>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </StateCell>
      <StateCell label="Line only, three panels">
        <div className="h-40 w-full overflow-hidden rounded-container border border-border-muted">
          <ResizablePanelGroup orientation="horizontal">
            <ResizablePanel minSize="15%">
              <Pane>One</Pane>
            </ResizablePanel>
            <ResizableHandle aria-label="Resize one" />
            <ResizablePanel minSize="15%">
              <Pane>Two</Pane>
            </ResizablePanel>
            <ResizableHandle aria-label="Resize two" />
            <ResizablePanel minSize="15%">
              <Pane>Three</Pane>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function ResizablePreview() {
  return (
    <div className="flex h-12 w-32 overflow-hidden rounded-container border border-border-muted">
      <div className="w-2/5" />
      <div className="w-px bg-border-muted" />
      <div className="flex-1" />
    </div>
  );
}
