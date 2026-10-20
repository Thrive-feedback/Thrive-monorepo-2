import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import type { AnswerAskAction } from '@/lib/feedback/answer-ask-state.type';
import type { Teammate } from '@/lib/feedback/teammate.type';
import type { WaitingAsk } from '@/lib/feedback/waiting-ask.type';
import { AnswerAskForm, AnswerAskFormSkeleton } from './answer-ask-form';
import { FeedbackText } from './feedback-text';
import { PersonName } from './person-name';

export type AnswerAskViewProps = {
  /** The Ask, or `null` when none with that id is waiting for this person. */
  ask: WaitingAsk | null;
  /** Offered on `@` in the answer. */
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#` in the answer. */
  workspaceGoals: readonly string[];
  /** Sends the answer: Home's server action, or a stand-in. */
  action: AnswerAskAction;
};

/**
 * Where a Giver answers: who asked, what about, and one box. An Ask that has already been
 * answered gets no box — the first answer is final, so offering one would only earn a refusal.
 *
 * An Ask that is not waiting for this person says so in place rather than turning the page into
 * a 404; that is also the answer for one waiting on somebody else.
 */
export function AnswerAskView({
  ask,
  teammates,
  workspaceGoals,
  action,
}: AnswerAskViewProps) {
  if (!ask) {
    return (
      <Text variant="body-2" tone="muted">
        This Ask isn&apos;t waiting for you.
      </Text>
    );
  }
  const asker = ask.requesterName ?? 'A teammate';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Text variant="subtitle-3" as="h3">
          <PersonName name={asker} inactive={ask.requesterInactive} /> asked
          about <FeedbackText text={ask.topic} tags={ask.topicTags} />
        </Text>
        <Text variant="body-3" tone="muted">
          Only <PersonName name={asker} inactive={ask.requesterInactive} /> can
          read what you write, and your name goes with it.
        </Text>
      </div>
      {ask.status === 'PENDING' ? (
        <AnswerAskForm
          askId={ask.askId}
          requesterName={ask.requesterName}
          teammates={teammates}
          workspaceGoals={workspaceGoals}
          action={action}
        />
      ) : (
        <Text variant="body-2">
          You have already answered this. The first answer is the one that
          stands.
        </Text>
      )}
    </div>
  );
}

/** An `AnswerAskView` still loading: who asked about what, who reads it, and the form. */
export function AnswerAskViewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Skeleton className="w-2/3 text-subtitle-3" />
        <Skeleton className="w-3/4 text-body-3" />
      </div>
      <AnswerAskFormSkeleton />
    </div>
  );
}
