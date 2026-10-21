'use client';

import { Suspense, use, useEffect, useRef, useState } from 'react';
import { Text } from '@/components/atoms/text';
import type { AnswerAskViewProps } from '@/components/organisms/answer-ask-view';
import { FeedbackComposer } from '@/components/organisms/feedback-composer';
import { FeedbackFeed } from '@/components/organisms/feedback-feed';
import { GivenFeedbackListView } from '@/components/organisms/given-feedback-list-view';
import type { HomeDialogProps } from '@/components/organisms/home-dialog';
import { ReceivedFeedbackListView } from '@/components/organisms/received-feedback-list-view';
import { SentRequestListView } from '@/components/organisms/sent-request-list-view';
import { WaitingAskListView } from '@/components/organisms/waiting-ask-list-view';
import { HomeView } from '@/components/templates/home-view';
import type { AnswerAskAction } from '@/lib/feedback/answer-ask-state.type';
import type { GiveFeedbackAction } from '@/lib/feedback/give-feedback-state.type';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import type { RequestFeedbackAction } from '@/lib/feedback/request-feedback-state.type';
import type { SentRequest } from '@/lib/feedback/sent-request.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { preloadable } from '@/lib/preloadable.util';
import type { HomeTab } from '@/lib/routes.constant';
import { whenIdle } from '@/lib/when-idle.util';
import { LANDING_COPY } from './landing-copy.constant';
import {
  PREVIEW_GIVEN,
  PREVIEW_RECEIVED,
  PREVIEW_SENT_REQUESTS,
  PREVIEW_SHARED_WITH_ME,
  PREVIEW_TEAMMATES,
  PREVIEW_WAITING_ASKS,
  PREVIEW_WORKSPACE_FEED,
  PREVIEW_WORKSPACE_GOALS,
  PREVIEW_WORKSPACE_NAME,
} from './landing-home-preview.mock';
import { scrollTabsIntoColumn } from './landing-preview-scroll.util';

const { preview } = LANDING_COPY;

/*
 * The dialog that answers an Ask, and the form inside it, show only once a visitor opens one, so
 * their code loads apart from the page, fetched once the browser is idle.
 */
/** Fetches the dialog ahead of need, as the preview does once the browser is idle. */
export const preloadAnswerDialog = preloadable(() =>
  Promise.all([
    import('@/components/organisms/home-dialog'),
    import('@/components/organisms/answer-ask-view'),
  ]),
);

/** `HomeDialog` around `AnswerAskView`, as Home opens an Ask, once their code has arrived. */
function AnswerDialog({
  title,
  close,
  ...view
}: Pick<HomeDialogProps, 'title' | 'close'> & AnswerAskViewProps) {
  const [{ HomeDialog }, { AnswerAskView }] = use(preloadAnswerDialog());
  return (
    <HomeDialog title={title} close={close}>
      <AnswerAskView {...view} />
    </HomeDialog>
  );
}

/**
 * Home, drawn by Home's own template and components, on made-up data, inside a window a visitor
 * can click through. Changing Home changes this, because nothing here redraws Home: only the data
 * and the two things Home sends to the API are swapped. Sending a Feedback Request lists it under
 * My requests; answering an Ask marks it answered, and the dialog then says so, as Home's does.
 * All of it lives in this component's state, and a reload starts it over.
 *
 * Home keeps its tab and its open Ask in the address. Here they are state, so clicking around
 * never changes the landing page's own URL. The tab is the preview's own unless `tab` is passed,
 * which lets the tour beside it open a tab and follow the ones the visitor opens.
 */
export function LandingHomePreview({
  tab: controlledTab,
  onTabChange,
}: {
  tab?: HomeTab;
  onTabChange?: (tab: HomeTab) => void;
}) {
  const [ownTab, setOwnTab] = useState<HomeTab>('workspace');
  const tab = controlledTab ?? ownTab;
  const windowRef = useRef<HTMLDivElement>(null);

  // Narrow, the window itself scrolls and Home's tabs sit under the composer, below its fold.
  // Opening with the tabs in view shows the open tab as soon as the window does.
  useEffect(() => {
    const body = windowRef.current;
    if (body?.parentElement && getComputedStyle(body).overflowY === 'auto') {
      scrollTabsIntoColumn(body.parentElement, 'auto');
    }
  }, []);
  useEffect(
    () =>
      whenIdle(() => {
        void preloadAnswerDialog();
      }),
    [],
  );
  function setTab(next: HomeTab) {
    setOwnTab(next);
    onTabChange?.(next);
  }
  const [sentRequests, setSentRequests] = useState<readonly SentRequest[]>(
    PREVIEW_SENT_REQUESTS,
  );
  const [waitingAsks, setWaitingAsks] =
    useState<readonly MyAsk[]>(PREVIEW_WAITING_ASKS);
  const [openAskId, setOpenAskId] = useState<string | null>(null);
  // A new key after each send starts the composer over, as Home's redirect does.
  const [composerKey, setComposerKey] = useState(0);

  const requestFeedback: RequestFeedbackAction = async (
    _previous,
    formData,
  ) => {
    const giver = PREVIEW_TEAMMATES.find(
      (teammate) => teammate.accountId === formData.get('giverAccountId'),
    );
    const sent: SentRequest = {
      id: `preview-request-sent-${composerKey}`,
      topic: String(formData.get('topic') ?? '').trim(),
      // The preview binds nothing: it has no Workspace Goals and reaches no API.
      topicTags: NO_TEXT_TAGS,
      sentAt: new Date().toISOString(),
      asks: [
        {
          askId: `preview-sent-ask-${composerKey}`,
          giverName: giver?.name ?? null,
          giverInactive: false,
          status: 'PENDING',
        },
      ],
    };
    setSentRequests((current) => [sent, ...current]);
    setTab('my-requests');
    setComposerKey((key) => key + 1);
    return {};
  };

  // What was given goes to someone else, so nothing here lists it; the composer starts over.
  const giveFeedback: GiveFeedbackAction = async () => {
    setComposerKey((key) => key + 1);
    return {};
  };

  const answerAsk: AnswerAskAction = async (_previous, formData) => {
    const askId = formData.get('askId');
    setWaitingAsks((current) =>
      current.map((ask) =>
        ask.askId === askId ? { ...ask, status: 'ANSWERED' } : ask,
      ),
    );
    return {};
  };

  const openAsk = waitingAsks.find((ask) => ask.askId === openAskId);

  function panelFor(value: HomeTab) {
    switch (value) {
      case 'workspace':
        return (
          <FeedbackFeed
            items={PREVIEW_WORKSPACE_FEED}
            emptyMessage="Nothing has been shared with everyone yet."
          />
        );
      case 'shared':
        return (
          <FeedbackFeed
            items={PREVIEW_SHARED_WITH_ME}
            emptyMessage="Nobody has shared Feedback with you yet."
          />
        );
      case 'my-requests':
        return <SentRequestListView requests={sentRequests} />;
      case 'waiting':
        return (
          <WaitingAskListView
            asks={waitingAsks}
            askTarget={(askId) => ({ onSelect: () => setOpenAskId(askId) })}
          />
        );
      case 'received':
        return <ReceivedFeedbackListView items={PREVIEW_RECEIVED} />;
      case 'given':
        return <GivenFeedbackListView items={PREVIEW_GIVEN} />;
    }
  }

  return (
    <section aria-label={preview.label} className="flex w-full flex-col gap-3">
      <div className="overflow-hidden rounded-control border border-border-subtle bg-surface-base shadow-high">
        <div
          ref={windowRef}
          className="h-160 overflow-y-auto px-inset-container py-6 lg:h-180 lg:overflow-hidden"
        >
          <HomeView
            workspaceName={PREVIEW_WORKSPACE_NAME}
            headingLevel={2}
            composer={
              <FeedbackComposer
                key={composerKey}
                teammates={PREVIEW_TEAMMATES}
                workspaceGoals={PREVIEW_WORKSPACE_GOALS}
                requestAction={requestFeedback}
                giveAction={giveFeedback}
              />
            }
            workspaceFeed={
              <FeedbackFeed
                items={PREVIEW_WORKSPACE_FEED}
                emptyMessage="Nothing has been shared with everyone yet."
              />
            }
            tab={tab}
            targetFor={(value) => ({ onSelect: () => setTab(value) })}
            panelFor={panelFor}
            splitClassName="h-full"
          />
        </div>
      </div>
      <Text variant="body-2" className="text-center text-fg-secondary">
        {preview.caption}
      </Text>
      {openAsk && (
        <Suspense fallback={null}>
          <AnswerDialog
            key={openAsk.askId}
            title="Give your feedback"
            close={{ onSelect: () => setOpenAskId(null) }}
            ask={{
              ...openAsk,
              feedbackRequestId: `${openAsk.askId}-request`,
            }}
            teammates={PREVIEW_TEAMMATES}
            workspaceGoals={PREVIEW_WORKSPACE_GOALS}
            action={answerAsk}
          />
        </Suspense>
      )}
    </section>
  );
}
