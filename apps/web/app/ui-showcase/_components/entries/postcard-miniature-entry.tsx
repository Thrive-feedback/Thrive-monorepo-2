import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import {
  SAMPLE_ANSWERED_CARD,
  SAMPLE_ASKED_CARD,
  SAMPLE_GIVEN_CARD,
} from './feed-card-samples.constant';
import { PostcardMiniatureDemo } from './postcard-miniature-demos';

export function PostcardMiniatureEntry() {
  return (
    <ShowcaseEntry
      name="PostcardMiniature"
      level="organism"
      origin="thrive"
      source="components/organisms/postcard-miniature/postcard-miniature.tsx — PendingPostcardMiniature wraps it inside a link."
      summary="The back of a real postcard made small: its paper, stamp, postmark, stickers and words, scaled as one piece so its lines break where they did. Below md the words give way to lines, where they would be too small to read."
      useFor="Every card that opens a postcard: Feedback and Kudos on Home, an Ask waiting to be answered, a request and its answers in Received."
      avoidFor="Reading a postcard: open the whole one in PostcardDialog."
      usage={`import { PostcardMiniature } from '@/components/organisms/postcard-miniature/postcard-miniature';
import { PendingPostcardMiniature } from '@/components/organisms/postcard-miniature/pending-postcard-miniature';

<PostcardMiniature card={item.card} />
<FeedCardPreview id={item.id} target={target} label="Open postcard: …">
  <PendingPostcardMiniature card={item.card} size="lg" />
</FeedCardPreview>`}
      props={[
        {
          name: 'card',
          type: 'ReadPostcard | AskedPostcard',
          description:
            'A sent card, an answer on its halved card, or a request nobody has answered yet.',
        },
        {
          name: 'size',
          type: "'fill' | 'lg'",
          defaultValue: "'fill'",
          description:
            '`fill` takes the width of what holds it; `lg` is the one size every card in a list draws it at.',
        },
        {
          name: 'isPending',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Fades and pulses it while what it opens is on its way. PendingPostcardMiniature sets it from its link.',
        },
      ]}
      accessibility={[
        'Hidden from screen readers and inert, so whatever holds it names the postcard.',
        'With reduced motion, a pending press fades without pulsing.',
      ]}
    >
      <StateCell label="Given" hint="The size every card in a list draws it.">
        <PostcardMiniatureDemo card={SAMPLE_GIVEN_CARD} size="lg" />
      </StateCell>
      <StateCell label="Answered">
        <PostcardMiniatureDemo card={SAMPLE_ANSWERED_CARD} size="lg" />
      </StateCell>
      <StateCell
        label="Asked"
        hint="Nobody has answered: the right half is blank."
      >
        <PostcardMiniatureDemo card={SAMPLE_ASKED_CARD} size="lg" />
      </StateCell>
      <StateCell label="Filling its box" wide>
        <div className="w-72">
          <PostcardMiniatureDemo card={SAMPLE_GIVEN_CARD} />
        </div>
      </StateCell>
      <StateCell label="Pending">
        <PostcardMiniatureDemo card={SAMPLE_GIVEN_CARD} size="lg" isPending />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function PostcardMiniaturePreview() {
  return <PostcardMiniatureDemo card={SAMPLE_GIVEN_CARD} size="lg" />;
}
