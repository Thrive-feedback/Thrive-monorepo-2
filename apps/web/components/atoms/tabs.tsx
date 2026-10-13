'use client';

import { Tabs as TabsPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn.util';
import styles from './tabs.module.css';

/*
 * The parts are Radix's, written as a composition:
 *
 *   <Tabs value={tab} onValueChange={setTab}>
 *     <TabsList aria-label="Feedback"><TabsTrigger value="feed">Feed</TabsTrigger></TabsList>
 *     <TabsContent value="feed">…</TabsContent>
 *   </Tabs>
 *
 * When the tab lives in the URL, give each trigger `asChild` around a Next `Link` and set
 * `activationMode="manual"` on `Tabs`: the arrow keys then only move focus, and Enter follows
 * the link, so moving through the tabs never navigates by itself.
 */

export type TabsProps = React.ComponentPropsWithRef<typeof TabsPrimitive.Root>;

export function Tabs({ className, ...rest }: TabsProps) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-4', className)}
      {...rest}
    />
  );
}

export type TabsListProps = React.ComponentPropsWithRef<
  typeof TabsPrimitive.List
>;

/** Name the list with `aria-label` when nothing on the page already names it. */
export function TabsList({ className, ...rest }: TabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'flex items-center gap-1 overflow-x-auto border-border-subtle border-b',
        styles.list,
        className,
      )}
      {...rest}
    />
  );
}

export type TabsTriggerProps = React.ComponentPropsWithRef<
  typeof TabsPrimitive.Trigger
>;

export function TabsTrigger({ className, ...rest }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        '-mb-px inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-t-element border-transparent border-b-3 px-3 py-2 text-button-sm text-fg-secondary hover:text-fg-primary disabled:cursor-not-allowed disabled:text-fg-disabled data-[state=active]:border-action-primary data-[state=active]:text-fg-primary',
        className,
      )}
      {...rest}
    />
  );
}

export type TabsContentProps = React.ComponentPropsWithRef<
  typeof TabsPrimitive.Content
>;

export function TabsContent({ className, ...rest }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex flex-col gap-4', className)}
      {...rest}
    />
  );
}
