'use client';

import { useState } from 'react';
import { Text } from '@/components/atoms/text';
import { AnswerAskView } from '@/components/organisms/answer-ask-view';
import { FeedbackComposer } from '@/components/organisms/feedback-composer';
import { FeedbackFeed } from '@/components/organisms/feedback-feed';
import { HomeDialog } from '@/components/organisms/home-dialog';
import { ReceivedFeedbackListView } from '@/components/organisms/received-feedback-list-view';
import { SentRequestListView } from '@/components/organisms/sent-request-list-view';
import { WaitingAskListView } from '@/components/organisms/waiting-ask-list-view';
import { HomeView } from '@/components/templates/home-view';
import type { AnswerAskAction } from '@/lib/feedback/answer-ask-state.type';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import type { RequestFeedbackAction } from '@/lib/feedback/request-feedback-state.type';
import type { SentRequest } from '@/lib/feedback/sent-request.type';
import type { HomeTab } from '@/lib/routes.constant';
import { LANDING_COPY } from './landing-copy.constant';
import {
  PREVIEW_RECEIVED,
  PREVIEW_SENT_REQUESTS,
  PREVIEW_SHARED_WITH_ME,
  PREVIEW_TEAMMATES,
  PREVIEW_WAITING_ASKS,
  PREVIEW_WORKSPACE_FEED,
  PREVIEW_WORKSPACE_NAME,
} from './landing-home-preview.mock';

const { preview } = LANDING_COPY;

/**
 * Home, drawn by Home's own template and components, on made-up data, inside a window a visitor
 * can click through. Changing Home changes this, because nothing here redraws Home: only the data
 * and the two things Home sends to the API are swapped. Sending a Feedback Request lists it under
 * My requests; answering an Ask marks it answered, and the dialog then says so, as Home's does.
 * All of it lives in this component's state, and a reload starts it over.
 *
 * Home keeps its tab and its open Ask in the address. Here they are state, so clicking around
 * never changes the landing page's own URL.
 */
export function LandingHomePreview() {
  const [tab, setTab] = useState<HomeTab>('workspace');
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
      sentAt: new Date().toISOString(),
      asks: [
        {
          askId: `preview-sent-ask-${composerKey}`,
          giverName: giver?.name ?? null,
          status: 'PENDING',
        },
      ],
    };
    setSentRequests((current) => [sent, ...current]);
    setTab('my-requests');
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
    }
  }

  return (
    <section
      aria-label={preview.label}
      className="mx-auto flex w-full max-w-5xl flex-col gap-3"
    >
      <div className="overflow-hidden rounded-page border border-border-subtle bg-surface-base shadow-high">
        <div
          aria-hidden="true"
          className="flex items-center gap-3 border-border-subtle border-b bg-surface-subtle px-4 py-3"
        >
          <span className="flex gap-1.5">
            <span className="size-3 rounded-full bg-border-default" />
            <span className="size-3 rounded-full bg-border-default" />
            <span className="size-3 rounded-full bg-border-default" />
          </span>
          <Text
            as="span"
            variant="caption"
            tone="muted"
            className="mx-auto rounded-chip bg-surface-base px-3 py-1"
          >
            {preview.address}
          </Text>
        </div>
        <div className="h-160 overflow-y-auto px-inset-container py-6 lg:h-180 lg:overflow-hidden">
          <HomeView
            workspaceName={PREVIEW_WORKSPACE_NAME}
            headingLevel={2}
            composer={
              <FeedbackComposer
                key={composerKey}
                teammates={PREVIEW_TEAMMATES}
                requestAction={requestFeedback}
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
      <Text variant="body-3" tone="muted" className="text-center">
        {preview.caption}
      </Text>
      {openAsk && (
        <HomeDialog
          key={openAsk.askId}
          title="Give your feedback"
          close={{ onSelect: () => setOpenAskId(null) }}
        >
          <AnswerAskView
            ask={{ ...openAsk, feedbackRequestId: `${openAsk.askId}-request` }}
            action={answerAsk}
          />
        </HomeDialog>
      )}
    </section>
  );
}
