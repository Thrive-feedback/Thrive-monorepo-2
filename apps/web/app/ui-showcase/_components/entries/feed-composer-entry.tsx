import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { FeedComposerSkeleton } from '@/components/organisms/feed-composer/feed-composer-skeleton';
import { FeedComposerDemo } from './feed-composer-demo';

export function FeedComposerEntry() {
  return (
    <ShowcaseEntry
      name="FeedComposer"
      level="organism"
      origin="thrive"
      source="components/organisms/feed-composer/feed-composer.tsx — PhotoAvatar + AutocompleteInput + three Buttons."
      summary="The first line of something to write, at the head of the feed. Pressing what it is to be carries the words onto a postcard."
      useFor="The head of Home in the new Home."
      avoidFor="Writing the whole message: that happens on the postcard. /home, which keeps FeedbackComposer."
      usage={`import { FeedComposer } from '@/components/organisms/feed-composer/feed-composer';

<FeedComposer
  writer={writer}
  teammates={teammates}
  workspaceGoals={workspaceGoals}
  message={message}
  onMessageChange={setMessage}
  onChoose={openPostcard}
/>`}
      props={[
        {
          name: 'writer',
          type: '{ name: string; photoUrl: string | null }',
          description: 'Who is writing, drawn beside the field.',
        },
        {
          name: 'teammates',
          type: 'Teammate[]',
          description: 'Who `@` offers.',
        },
        {
          name: 'workspaceGoals',
          type: 'string[]',
          description: 'What `#` offers.',
        },
        {
          name: 'message',
          type: 'string',
          description: 'What is typed.',
        },
        {
          name: 'onMessageChange',
          type: '(message: string) => void',
          description: 'What is typed changed, cut to 1,000 characters.',
        },
        {
          name: 'onChoose',
          type: "(choice: 'ask' | 'give' | 'kudos') => void",
          description: 'Ask, Give or Kudos was pressed.',
        },
      ]}
      accessibility={[
        'A named region, with the field named for a screen reader.',
        'Suggestions are chosen with the arrow keys while focus stays in the field.',
      ]}
    >
      <StateCell label="Empty" wide>
        <FeedComposerDemo />
      </StateCell>
      <StateCell label="Written" wide>
        <FeedComposerDemo initialMessage="The demo went well, @mali" />
      </StateCell>
      <StateCell label="Completing a tag" hint="Type @ or #." wide>
        <FeedComposerDemo initialMessage="@" />
      </StateCell>
      <StateCell label="Loading" wide>
        <div className="w-full max-w-180">
          <FeedComposerSkeleton />
        </div>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function FeedComposerPreview() {
  return (
    <div className="w-72">
      <FeedComposerDemo />
    </div>
  );
}
