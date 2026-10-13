import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/atoms/tabs';
import { Text } from '@/components/atoms/text';

function FeedbackTabs({
  label,
  disabled = false,
}: {
  label: string;
  disabled?: boolean;
}) {
  return (
    <Tabs defaultValue="feed" className="w-full">
      <TabsList aria-label={label}>
        <TabsTrigger value="feed">Workspace feed</TabsTrigger>
        <TabsTrigger value="mine">My requests</TabsTrigger>
        <TabsTrigger value="waiting" disabled={disabled}>
          Waiting for me
        </TabsTrigger>
      </TabsList>
      <TabsContent value="feed">
        <Text variant="body-2">Feedback shared with everyone.</Text>
      </TabsContent>
      <TabsContent value="mine">
        <Text variant="body-2">The requests you sent.</Text>
      </TabsContent>
      <TabsContent value="waiting">
        <Text variant="body-2">What you have been asked.</Text>
      </TabsContent>
    </Tabs>
  );
}

export function TabsEntry() {
  return (
    <ShowcaseEntry
      name="Tabs"
      level="atom"
      origin="shadcn"
      source="components/atoms/tabs.tsx — Tabs, TabsList, TabsTrigger, TabsContent"
      summary="Shows one of several views of the same place, one at a time."
      useFor="Views of one page that a person switches between and returns to."
      avoidFor="Steps in order (a stepper) or moving between pages (the navbar)."
      usage={`import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/atoms/tabs';

<Tabs value={tab} onValueChange={setTab}>
  <TabsList aria-label="Feedback">
    <TabsTrigger value="feed">Workspace feed</TabsTrigger>
    <TabsTrigger value="mine">My requests</TabsTrigger>
  </TabsList>
  <TabsContent value="feed">…</TabsContent>
  <TabsContent value="mine">…</TabsContent>
</Tabs>

// Tab kept in the URL: links, and arrows that only move focus.
<Tabs value={tab} activationMode="manual">
  <TabsList aria-label="Feedback">
    <TabsTrigger value="feed" asChild>
      <Link href="/home?tab=feed">Workspace feed</Link>
    </TabsTrigger>
  </TabsList>
</Tabs>`}
      props={[
        {
          name: 'value / defaultValue',
          type: 'string',
          description: 'The open tab, controlled or uncontrolled.',
        },
        {
          name: 'onValueChange',
          type: '(value: string) => void',
          description: 'Called when another tab is picked.',
        },
        {
          name: 'activationMode',
          type: "'automatic' | 'manual'",
          defaultValue: "'automatic'",
          description:
            'Manual: arrows move focus, Enter or Space opens. Use it when a tab is a link.',
        },
        {
          name: 'TabsTrigger asChild',
          type: 'boolean',
          description: 'Paint a Link as the tab, for a tab kept in the URL.',
        },
        {
          name: 'TabsTrigger disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'A tab that cannot be opened now.',
        },
      ]}
      accessibility={[
        'The list is one tab stop; the arrows move between tabs, Home and End jump to the ends.',
        'Each panel is labelled by its tab.',
        'Name the list with aria-label when no heading on the page already names it.',
      ]}
    >
      <StateCell label="Default" hint="Pick a tab">
        <FeedbackTabs label="Feedback" />
      </StateCell>
      <StateCell label="With a disabled tab">
        <FeedbackTabs label="Feedback, one disabled" disabled />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function TabsPreview() {
  return (
    <Tabs defaultValue="feed">
      <TabsList aria-label="Feedback">
        <TabsTrigger value="feed">Feed</TabsTrigger>
        <TabsTrigger value="mine">Mine</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
