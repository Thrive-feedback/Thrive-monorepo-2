'use client';

import { useRef, useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/atoms/tabs';
import { Text } from '@/components/atoms/text';
import glass from '@/components/organisms/glass.module.css';
import { cn } from '@/lib/cn.util';
import type { HomeTab } from '@/lib/routes.constant';
import { LANDING_COPY } from './landing-copy.constant';
import { LandingHomePreview } from './landing-home-preview';
import { NotedText } from './landing-note';
import {
  preferredScrollBehavior,
  scrollTabsIntoColumn,
} from './landing-preview-scroll.util';

const { tour } = LANDING_COPY;

/**
 * Four chapters of the feedback loop as tabs over a live preview of Home, set together on one
 * stage of frosted glass; the preview is the one panel, labelled by whichever chapter is open.
 * Choosing a chapter opens the Home tab that shows it, and opening a tab inside the preview
 * selects the chapter it belongs to, so the two never disagree. The Workspace tab is open first,
 * as on Home.
 */
export function LandingTour() {
  const [tab, setTab] = useState<HomeTab>('workspace');
  const stageRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Brings the stage and the whole preview into view with the chosen tab showing, since a
  // chapter would otherwise change a tab below the preview's fold.
  function openChapter(next: HomeTab) {
    setTab(next);
    const behavior = preferredScrollBehavior();
    stageRef.current?.scrollIntoView({ block: 'start', behavior });
    if (previewRef.current) scrollTabsIntoColumn(previewRef.current, behavior);
  }

  // Radix hands back a string; only a chapter's own tab is taken from it.
  function onChapterChange(value: string) {
    const chapter = tour.chapters.find((item) => item.tab === value);
    if (chapter) openChapter(chapter.tab);
  }

  return (
    <section
      id={tour.id}
      aria-labelledby="tour-title"
      className="mx-auto flex w-full max-w-300 scroll-mt-24 flex-col gap-8"
    >
      <Text
        as="h2"
        id="tour-title"
        variant="display-2"
        className="text-balance text-center"
      >
        <NotedText text={tour.title} note={tour.aside} />
      </Text>
      <div
        ref={stageRef}
        className={cn(
          'scroll-mt-24 rounded-page p-2 sm:p-4 md:p-8',
          glass.glass,
          glass.neutral,
        )}
      >
        <Tabs
          value={tab}
          onValueChange={onChapterChange}
          className="gap-5 md:gap-8"
        >
          <TabsList
            aria-label={tour.switchLabel}
            className="mx-auto w-fit max-w-full"
          >
            {tour.chapters.map((chapter) => (
              <TabsTrigger
                key={chapter.tab}
                value={chapter.tab}
                className="text-button-md"
              >
                {chapter.title}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent ref={previewRef} value={tab}>
            <LandingHomePreview tab={tab} onTabChange={setTab} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
