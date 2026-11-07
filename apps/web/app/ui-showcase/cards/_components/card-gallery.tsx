'use client';

import { useRef } from 'react';
import {
  CardsEmpty,
  type CardsEmptyProps,
} from '@/app/(signed-in)/(sidebar)/_components/cards-empty';
import { ComposeAction } from '@/app/(signed-in)/(sidebar)/_components/compose-action';
import { PersonalItemTile } from '@/app/(signed-in)/(sidebar)/_components/personal-item-tile';
import { PersonalItemsGridSkeleton } from '@/app/(signed-in)/(sidebar)/_components/personal-items-skeleton';
import { RequestCard } from '@/app/(signed-in)/(sidebar)/_components/request-card';
import { RequestTile } from '@/app/(signed-in)/(sidebar)/_components/request-tile';
import type { ComposeChoice } from '@/app/(signed-in)/(sidebar)/_lib/compose-choice.constant';
import type { ComposeContext } from '@/app/(signed-in)/(sidebar)/_lib/compose-context.service';
import { PERSONAL_ITEMS_GRID } from '@/app/(signed-in)/(sidebar)/_lib/personal-items-layout.constant';
import { FeedEmpty } from '@/app/(signed-in)/(sidebar)/home/_components/feed-empty';
import { KudosBoardCard } from '@/app/(signed-in)/(sidebar)/kudos/_components/kudos-board-card';
import { ReceivedFilter } from '@/app/(signed-in)/(sidebar)/received/_components/received-filter';
import { RECEIVED_EMPTY } from '@/app/(signed-in)/(sidebar)/received/_lib/received-empty.constant';
import { WaitingEmpty } from '@/app/(signed-in)/(sidebar)/waiting/_components/waiting-empty';
import {
  SAMPLE_ANSWERED_CARD,
  SAMPLE_ASKED_CARD,
  SAMPLE_GIVEN_CARD,
  SAMPLE_OFFERED,
  SAMPLE_READER,
  SAMPLE_REQUESTED,
  SAMPLE_TARGET,
} from '@/app/ui-showcase/_components/entries/feed-card-samples.constant';
import { SAMPLE_KUDOS } from '@/app/ui-showcase/_components/entries/kudos-samples.constant';
import {
  SAMPLE_BOARD_KUDOS,
  SAMPLE_LEGACY_KUDOS,
  SAMPLE_LEGACY_OFFERED,
  SAMPLE_LEGACY_REQUESTED,
  SAMPLE_MY_REQUEST,
  SAMPLE_MY_REQUEST_ALL_ANSWERED,
  SAMPLE_MY_REQUEST_MANY_ANSWERS,
  SAMPLE_MY_UNANSWERED_REQUEST,
  SAMPLE_PERSONAL_KUDOS,
  SAMPLE_PERSONAL_OFFERED,
  SAMPLE_PERSONAL_REQUESTED,
  SAMPLE_WAITING_ASK,
} from '@/app/ui-showcase/cards/_lib/card-samples.constant';
import { Button } from '@/components/atoms/button';
import { Card } from '@/components/atoms/card';
import { Text } from '@/components/atoms/text';
import { FeedCard } from '@/components/organisms/feed-card/feed-card';
import { FeedCardSkeleton } from '@/components/organisms/feed-card/feed-card-skeleton';
import { KudosFeedCard } from '@/components/organisms/feed-card/kudos-feed-card';
import { WaitingAskCard } from '@/components/organisms/feed-card/waiting-ask-card';
import { FeedbackCard } from '@/components/organisms/feedback-card';
import { KudosCard } from '@/components/organisms/kudos-card';
import { kudosCardDate } from '@/components/organisms/kudos-dialog/kudos-card.util';
import { KudosCardReadOnly } from '@/components/organisms/kudos-dialog/kudos-card-read-only';
import { PostcardMiniature } from '@/components/organisms/postcard-miniature/postcard-miniature';

/** Cards written from the showcase have nobody to go to and go nowhere. */
const SAMPLE_COMPOSE: ComposeContext = {
  workspaceId: 'showcase',
  teammates: [],
  workspaceGoals: [],
  writer: { name: 'Ann Lee', photoUrl: null },
};

/** Each empty place as Received, Given and the Kudos board draw it, with what to do there. */
const EMPTY_SPECIMENS: readonly (Omit<CardsEmptyProps, 'children'> & {
  state: string;
  usedOn: string;
  /** The cards it offers to write; none for a month with none, which links to every month. */
  choices: readonly ComposeChoice[];
})[] = [
  { state: 'All', usedOn: 'Received', ...RECEIVED_EMPTY.all },
  { state: 'My requests', usedOn: 'Received', ...RECEIVED_EMPTY.requests },
  { state: 'Given to me', usedOn: 'Received', ...RECEIVED_EMPTY.offered },
  { state: 'Kudos', usedOn: 'Received', ...RECEIVED_EMPTY.kudos },
  {
    state: 'Nothing given',
    usedOn: 'Given',
    art: 'every',
    title: "You haven't given any Feedback yet.",
    choices: ['give'],
  },
  {
    state: 'Nothing on the board',
    usedOn: 'Kudos board',
    art: 'secondary',
    title: 'Nothing on the board yet',
    description: 'The first Kudos anyone gives lands here.',
    choices: ['kudos'],
  },
  {
    state: 'A month with none',
    usedOn: 'Kudos board',
    art: 'secondary',
    title: 'Nothing here from October 2026',
    choices: [],
  },
];

type SpecimenProps = {
  /** The component's name. */
  name: string;
  /** Which case of it this is. */
  state: string;
  /** Where it is used. */
  usedOn: string;
  children: React.ReactNode;
};

/** One card, with what it is and where it appears written under it. */
function Specimen({ name, state, usedOn, children }: SpecimenProps) {
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <div className="min-w-0">{children}</div>
      <figcaption className="flex flex-col">
        <Text variant="subtitle-4" as="span">
          {name} <span className="text-fg-secondary">· {state}</span>
        </Text>
        <Text variant="caption" tone="muted">
          {usedOn}
        </Text>
      </figcaption>
    </figure>
  );
}

type GallerySectionProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

function GallerySection({ title, description, children }: GallerySectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1 border-border-default border-b pb-3">
        <Text variant="subtitle-2" as="h2">
          {title}
        </Text>
        <Text variant="body-2" tone="muted" className="max-w-2xl">
          {description}
        </Text>
      </header>
      {children}
    </section>
  );
}

/** The board's cards wait for a drag or a press, which here go nowhere. */
function ignore() {}

function BoardCards() {
  const boardRef = useRef<HTMLUListElement>(null);

  return (
    <>
      <p id="card-gallery-board-hint" className="sr-only">
        Press to open, press twice to turn it over.
      </p>
      <ul ref={boardRef} className="grid h-96 grid-cols-3 gap-6">
        {SAMPLE_BOARD_KUDOS.map((kudos, position) => (
          <KudosBoardCard
            key={kudos.id}
            item={kudos}
            place={undefined}
            position={position}
            isTurned={position === 2}
            boardRef={boardRef}
            hintId="card-gallery-board-hint"
            onMove={ignore}
            onOpen={ignore}
            onTurn={ignore}
          />
        ))}
      </ul>
    </>
  );
}

/**
 * Every card Thrive draws, each the real component on sample data, grouped by where it appears and
 * at the width it has there, so cards that sit together can be compared side by side.
 */
export function CardGallery() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-14 px-4 py-12">
      <header className="flex flex-col gap-2">
        <Text variant="h5" as="h1" id="card-gallery-title" tabIndex={-1}>
          Cards
        </Text>
        <Text tone="muted" className="max-w-2xl">
          Every card in the app, side by side: the real components on sample
          data, at the width each one has where it appears. Pressing a card goes
          nowhere.
        </Text>
      </header>

      <GallerySection
        title="In a list"
        description="Home's feed, Waiting for me, and Received and Given in list view. These sit in one column, so they should share a ground, padding, header and type."
      >
        <div className="flex max-w-180 flex-col gap-6">
          <Specimen
            name="OfferedFeedbackCard"
            state="Feedback given unasked"
            usedOn="Home, Received, Given (list)"
          >
            <FeedCard
              item={SAMPLE_OFFERED}
              readerAccountId={SAMPLE_READER}
              target={SAMPLE_TARGET}
            />
          </Specimen>
          <Specimen
            name="RequestedFeedbackCard"
            state="An answer to a request"
            usedOn="Home, Received, Given (list)"
          >
            <FeedCard
              item={SAMPLE_REQUESTED}
              readerAccountId={SAMPLE_READER}
              target={SAMPLE_TARGET}
            />
          </Specimen>
          <Specimen
            name="KudosFeedCard"
            state="A Kudos"
            usedOn="Home, Received, Given (list)"
          >
            <KudosFeedCard
              kudos={SAMPLE_KUDOS}
              readerAccountId={SAMPLE_READER}
            />
          </Specimen>
          <Specimen
            name="WaitingAskCard"
            state="An Ask waiting for the reader"
            usedOn="Waiting for me"
          >
            <WaitingAskCard
              ask={SAMPLE_WAITING_ASK}
              card={SAMPLE_ASKED_CARD}
              target={SAMPLE_TARGET}
            />
          </Specimen>
          <Specimen
            name="RequestCard"
            state="The reader's own request, one of three answered"
            usedOn="Received, My requests (list)"
          >
            <RequestCard request={SAMPLE_MY_REQUEST} />
          </Specimen>
          <Specimen
            name="RequestCard"
            state="Many answered: four of six, two still pending"
            usedOn="Received, My requests (list)"
          >
            <RequestCard request={SAMPLE_MY_REQUEST_MANY_ANSWERS} />
          </Specimen>
          <Specimen
            name="RequestCard"
            state="Everyone answered: the last row is an answer"
            usedOn="Received, My requests (list)"
          >
            <RequestCard request={SAMPLE_MY_REQUEST_ALL_ANSWERED} />
          </Specimen>
          <Specimen
            name="RequestCard"
            state="Nobody has answered yet"
            usedOn="Received, My requests (list)"
          >
            <RequestCard request={SAMPLE_MY_UNANSWERED_REQUEST} />
          </Specimen>
          <Specimen
            name="FeedCardSkeleton"
            state="Loading"
            usedOn="Home, Waiting for me, Received, Given (list)"
          >
            <FeedCardSkeleton />
          </Specimen>
        </div>
      </GallerySection>

      <GallerySection
        title="In a grid"
        description="Received and Given in grid view. Each tile draws the real card made small, so a postcard and a Kudos should stand the same height in one row."
      >
        <div className={PERSONAL_ITEMS_GRID}>
          <Specimen
            name="PersonalItemTile"
            state="Offered Feedback"
            usedOn="Received, Given (grid)"
          >
            <PersonalItemTile
              item={SAMPLE_PERSONAL_OFFERED}
              side="received"
              readerAccountId={SAMPLE_READER}
            />
          </Specimen>
          <Specimen
            name="PersonalItemTile"
            state="Requested Feedback"
            usedOn="Received, Given (grid)"
          >
            <PersonalItemTile
              item={SAMPLE_PERSONAL_REQUESTED}
              side="given"
              readerAccountId={SAMPLE_READER}
            />
          </Specimen>
          <Specimen
            name="PersonalItemTile"
            state="A Kudos"
            usedOn="Received, Given (grid)"
          >
            <PersonalItemTile
              item={SAMPLE_PERSONAL_KUDOS}
              side="received"
              readerAccountId={SAMPLE_READER}
            />
          </Specimen>
          <Specimen
            name="RequestTile"
            state="One of three answered"
            usedOn="Received, My requests (grid)"
          >
            <RequestTile request={SAMPLE_MY_REQUEST} />
          </Specimen>
          <Specimen
            name="RequestTile"
            state="Four of six answered"
            usedOn="Received, My requests (grid)"
          >
            <RequestTile request={SAMPLE_MY_REQUEST_MANY_ANSWERS} />
          </Specimen>
          <Specimen
            name="RequestTile"
            state="Nobody has answered yet"
            usedOn="Received, My requests (grid)"
          >
            <RequestTile request={SAMPLE_MY_UNANSWERED_REQUEST} />
          </Specimen>
        </div>
        <Specimen
          name="PersonalItemsGridSkeleton"
          state="Loading"
          usedOn="Received, Given (grid)"
        >
          <PersonalItemsGridSkeleton />
        </Specimen>
      </GallerySection>

      <GallerySection
        title="Filters and empty lists"
        description="Received's filter, each kind pressed in its cards' colour, and what Received, Given and the Kudos board show with nothing in them: one thing to do, in its colour. The buttons open the real cards, with nobody to send them to."
      >
        <div className="flex flex-col gap-3">
          {(['all', 'requests', 'offered', 'kudos'] as const).map((show) => (
            <ReceivedFilter key={show} show={show} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Specimen name="FeedEmpty" state="All, nothing yet" usedOn="Home">
            <div className="rounded-page border border-border-muted">
              <FeedEmpty show="all" />
            </div>
          </Specimen>
          <Specimen
            name="WaitingEmpty"
            state="Nobody waiting"
            usedOn="Waiting for me"
          >
            <div className="rounded-page border border-border-muted">
              <WaitingEmpty />
            </div>
          </Specimen>
          {EMPTY_SPECIMENS.map(({ state, usedOn, choices, ...empty }) => (
            <Specimen
              key={state}
              name="CardsEmpty"
              state={state}
              usedOn={usedOn}
            >
              <div className="rounded-page border border-border-muted">
                <CardsEmpty {...empty}>
                  {choices.length > 0 ? (
                    choices.map((choice) => (
                      <ComposeAction
                        key={choice}
                        {...SAMPLE_COMPOSE}
                        choice={choice}
                        returnFocusTo="card-gallery-title"
                      />
                    ))
                  ) : (
                    <Button asChild>
                      <a href="#card-gallery-title">See every month</a>
                    </Button>
                  )}
                </CardsEmpty>
              </div>
            </Specimen>
          ))}
        </div>
      </GallerySection>

      <GallerySection
        title="On the Kudos board"
        description="Each Kudos hangs on the board leaning a little, over who gave it to whom. The third is turned to its back."
      >
        <BoardCards />
      </GallerySection>

      <GallerySection
        title="The cards themselves"
        description="The paper every card above draws: a postcard made small, and a Kudos card front and back."
      >
        <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Specimen
            name="PostcardMiniature"
            state="Given"
            usedOn="Offered Feedback cards and tiles"
          >
            <PostcardMiniature card={SAMPLE_GIVEN_CARD} />
          </Specimen>
          <Specimen
            name="PostcardMiniature"
            state="Answered"
            usedOn="Requested Feedback cards and tiles"
          >
            <PostcardMiniature card={SAMPLE_ANSWERED_CARD} />
          </Specimen>
          <Specimen
            name="PostcardMiniature"
            state="Asked, not answered"
            usedOn="Waiting for me, request cards and tiles"
          >
            <PostcardMiniature card={SAMPLE_ASKED_CARD} />
          </Specimen>
          <Specimen
            name="KudosCardReadOnly"
            state="Front"
            usedOn="Kudos cards, tiles and the board"
          >
            <KudosCardReadOnly
              message={SAMPLE_KUDOS.message}
              tags={SAMPLE_KUDOS.messageTags}
              drawing={SAMPLE_KUDOS.drawing}
              date={kudosCardDate(SAMPLE_KUDOS.givenAt)}
            />
          </Specimen>
          <Specimen
            name="KudosCardReadOnly"
            state="Back"
            usedOn="The board, turned over"
          >
            <KudosCardReadOnly
              message={SAMPLE_KUDOS.message}
              tags={SAMPLE_KUDOS.messageTags}
              drawing={SAMPLE_KUDOS.drawing}
              date={kudosCardDate(SAMPLE_KUDOS.givenAt)}
              side="back"
            />
          </Specimen>
        </div>
      </GallerySection>

      <GallerySection
        title="On the landing page"
        description="The clickable Home preview on the landing page (FeedbackFeed in landing-home-preview). These cards draw no postcard."
      >
        <div className="flex max-w-180 flex-col gap-6">
          <Specimen
            name="FeedbackCard"
            state="Offered, with Reactions"
            usedOn="Landing page, Home preview"
          >
            <FeedbackCard item={SAMPLE_LEGACY_OFFERED} />
          </Specimen>
          <Specimen
            name="FeedbackCard"
            state="Requested"
            usedOn="Landing page, Home preview"
          >
            <FeedbackCard item={SAMPLE_LEGACY_REQUESTED} />
          </Specimen>
          <Specimen
            name="KudosCard"
            state="A Kudos"
            usedOn="Landing page, Home preview"
          >
            <KudosCard item={SAMPLE_LEGACY_KUDOS} />
          </Specimen>
        </div>
      </GallerySection>

      <GallerySection
        title="Panels"
        description="The frosted panel a signed-out or onboarding step sits in. A frame for a form, not a card of content."
      >
        <Specimen
          name="Card"
          state="Default"
          usedOn="Sign-in, onboarding, choose a Workspace"
        >
          <Card title="Welcome to Thrive" titleAs="h2" className="max-w-110">
            <Text variant="body-2" tone="muted">
              A step's form goes here.
            </Text>
          </Card>
        </Specimen>
      </GallerySection>
    </main>
  );
}
