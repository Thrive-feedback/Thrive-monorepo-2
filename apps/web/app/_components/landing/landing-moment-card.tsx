'use client';

// A client component because the cards draw their stickers, and turn, with hooks, and a Moment's
// card opens its reading dialog when pressed.
import { useState } from 'react';
import { Postmark } from '@/components/atoms/postmark';
import { kudosCardDate } from '@/components/organisms/kudos-dialog/kudos-card.util';
import { KudosCardReadOnly } from '@/components/organisms/kudos-dialog/kudos-card-read-only';
import { Postcard } from '@/components/organisms/postcard-dialog/postcard';
import type {
  AnsweredPostcard,
  GivenPostcard,
} from '@/components/organisms/postcard-dialog/postcard-read.type';
import {
  PostcardAnsweredBack,
  PostcardGivenBack,
} from '@/components/organisms/postcard-dialog/postcard-read-back';
import {
  PostcardStampBoxReadOnly,
  PostcardStampReadOnly,
} from '@/components/organisms/postcard-dialog/postcard-stamp';
import { PostcardStickersReadOnly } from '@/components/organisms/postcard-dialog/postcard-sticker';
import { PostcardMiniature } from '@/components/organisms/postcard-miniature/postcard-miniature';
import miniature from '@/components/organisms/postcard-miniature/postcard-miniature.module.css';
import { cn } from '@/lib/cn.util';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import styles from './landing.module.css';
import { LANDING_COPY } from './landing-copy.constant';
import { lazyComponent } from './landing-lazy.util';
import { type LandingKudos, MOMENT_CARDS } from './landing-team.mock';

const { moments } = LANDING_COPY;

/** A sent postcard, as the landing page shows the team's. */
type SentPostcard = GivenPostcard | AnsweredPostcard;

/*
 * The app's reading dialog, fetched once a visitor reaches for a Moment's card, so the page a
 * visitor lands on carries none of its code.
 */
const READ_DIALOG = lazyComponent(() =>
  import('@/components/organisms/postcard-dialog/postcard-read-dialog').then(
    (module) => module.PostcardReadDialog,
  ),
);

/**
 * The Moment pressed last, so that when two are pressed before the dialog's code arrives, only the
 * last one opens, and never two dialogs one on top of the other.
 */
let lastPressed: number | undefined;

/** What differs by card: how it looks, when it went, its stickers, and what is on its back. */
function showing(card: GivenPostcard | AnsweredPostcard) {
  if (card.kind === 'give') {
    return {
      look: card,
      sentOn: card.sentOn,
      stickers: card.stickers,
      back: <PostcardGivenBack card={card} />,
    };
  }
  const [answer] = card.answers;
  return {
    look: card.ask,
    sentOn: answer.sentOn,
    // The card's own first, so a later sticker sits on an earlier one.
    stickers: [...card.ask.stickers, ...answer.stickers],
    back: <PostcardAnsweredBack card={card} answer={answer} answerIndex={0} />,
  };
}

/**
 * The back of a sent postcard at its own size, as the app's read dialog shows one, for drawing
 * scaled down whole from `md` up. The postmark is struck across the stamp, cancelling it, so its
 * waves never run through the writing.
 */
function LandingPostcardBack({ card }: { card: SentPostcard }) {
  const { look, sentOn, stickers, back } = showing(card);

  return (
    <Postcard
      side="back"
      tone={look.tone}
      templateKey={look.templateKey}
      stickers={{
        front: null,
        back: <PostcardStickersReadOnly stickers={stickers} side="back" />,
      }}
      stamp={
        <>
          {look.stampKey ? (
            <PostcardStampReadOnly stampKey={look.stampKey} />
          ) : (
            <PostcardStampBoxReadOnly />
          )}
          <Postmark
            date={sentOn}
            trail="right"
            className={cn(
              'pointer-events-none absolute top-4 right-3 z-30 w-24',
              styles.postmark,
            )}
          />
        </>
      }
    >
      {back}
    </Postcard>
  );
}

export type LandingPostcardSmallProps = {
  card: SentPostcard;
};

/**
 * A sent postcard made small, as a card in the app's lists shows the one it is about, for a part of
 * the page drawn on the server: the small card draws its stickers with hooks, so it is drawn here.
 * It is a picture of the words beside it, so assistive technology skips it.
 */
export function LandingPostcardSmall({ card }: LandingPostcardSmallProps) {
  return (
    <span aria-hidden="true" inert className="block w-full">
      <PostcardMiniature card={card} size="lg" />
    </span>
  );
}

export type LandingKudosSmallProps = {
  kudos: LandingKudos;
};

/**
 * A sent Kudos on its card, for a part of the page drawn on the server: the card draws its
 * stickers with hooks, so it is drawn here. A picture, so assistive technology skips it.
 */
export function LandingKudosSmall({ kudos }: LandingKudosSmallProps) {
  return (
    <span aria-hidden="true" inert className="block">
      <KudosCardReadOnly
        message={kudos.message}
        tags={NO_TEXT_TAGS}
        drawing={kudos.drawing}
        date={kudosCardDate(kudos.givenAt)}
      />
    </span>
  );
}

export type LandingStampProps = {
  /** Which stamp: a key from `POSTCARD_STAMPS`. */
  stampKey: string;
};

/**
 * One of the app's own stamps, as a postcard carries one, for a part of the page drawn on the
 * server: the stamp's module holds hooks, so it is drawn here. It places itself 5px in from its
 * holder's top right corner, and names itself for assistive technology by its picture.
 */
export function LandingStamp({ stampKey }: LandingStampProps) {
  return <PostcardStampReadOnly stampKey={stampKey} />;
}

export type LandingPostcardScaledProps = {
  card: SentPostcard;
};

/**
 * A sent postcard drawn small by its written back. From `md` up it is the whole card laid out at
 * the width it is written at and scaled down, so its postmark strikes the stamp and never the
 * writing; below `md` it is too small for words, and the miniature draws lines. A picture, so
 * assistive technology skips it.
 */
export function LandingPostcardScaled({ card }: LandingPostcardScaledProps) {
  return (
    <>
      {/* Lines alone: the miniature's own words show only from `md` up, where this one is gone. */}
      <PostcardMiniature card={card} hasWords={false} className="md:hidden" />
      <span
        aria-hidden="true"
        inert
        className={cn('hidden md:block', miniature.stage)}
      >
        <span className={cn('block', miniature.sheet)}>
          <LandingPostcardBack card={card} />
        </span>
      </span>
    </>
  );
}

/** Who wrote what a postcard says, for the title over it as the app titles one it reads. */
function writerOf(card: SentPostcard) {
  return card.kind === 'give' ? card.giver : card.answers[0].giver;
}

export type LandingMomentCardProps = {
  /** Which Moment, in the order the copy tells them. */
  index: number;
  /** The button's name: what pressing the card does, and which Moment it is. */
  label: string;
};

/**
 * A Moment on the postcard it would be written on, drawn small: an Ask and what came back on one,
 * or Feedback given unasked on its own. Pressed, it opens in the app's own reading dialog at the
 * size it was written at, where every word reads; the page quotes its words beside it for
 * assistive technology too.
 */
export function LandingMomentCard({ index, label }: LandingMomentCardProps) {
  const card = MOMENT_CARDS[index];
  const [ReadDialog, setReadDialog] = useState(READ_DIALOG.current);
  const [open, setOpen] = useState(false);
  if (!card) {
    return null;
  }

  function handleWarm() {
    READ_DIALOG.fetch().catch(() => {});
  }

  function handleRead() {
    lastPressed = index;
    if (ReadDialog) {
      setOpen(true);
      return;
    }
    READ_DIALOG.fetch().then(
      (dialog) => {
        setReadDialog(() => dialog);
        if (lastPressed === index) {
          setOpen(true);
        }
      },
      () => {},
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={handleRead}
        onPointerEnter={handleWarm}
        onFocus={handleWarm}
        className={cn(
          'block w-full cursor-pointer rounded-element',
          styles.momentCard,
        )}
      >
        <span className="block rounded-element shadow-high">
          <LandingPostcardScaled card={card} />
        </span>
      </button>
      {ReadDialog && (
        <ReadDialog
          title={`${moments.readTitle} ${writerOf(card).name}`}
          person={writerOf(card)}
          card={card}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}
