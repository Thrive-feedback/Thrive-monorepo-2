'use client';

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import type { KudosDraft } from '@/components/organisms/kudos-dialog/kudos-draft.type';
import { mentionedTeammates } from '@/lib/feedback/mentioned-teammates.util';
import type { TextTags } from '@/lib/feedback/text-tags.type';
import { LANDING_COPY } from './landing-copy.constant';
import { lazyComponent, whenIdle } from './landing-lazy.util';
import {
  LANDING_TEAMMATES,
  LANDING_VISITOR,
  LANDING_WORKSPACE_GOALS,
  LANDING_WRITER,
  type LandingKudos,
} from './landing-team.mock';

const { desk } = LANDING_COPY;

/** Which card on the desk is being written. */
export type DeskCard = 'ask' | 'give' | 'kudos';

/*
 * The real writing dialogs, fetched only once a visitor reaches for a card or the browser is idle
 * after the page has drawn, so the page a visitor lands on carries none of their code, and a tap
 * on a phone, which points and presses at once, still finds its dialog there.
 */
const DIALOGS = {
  postcard: lazyComponent(() =>
    import('@/components/organisms/postcard-dialog/postcard-dialog').then(
      (module) => module.PostcardDialog,
    ),
  ),
  kudos: lazyComponent(() =>
    import('@/components/organisms/kudos-dialog/kudos-dialog').then(
      (module) => module.KudosDialog,
    ),
  ),
};

/** The dialog that writes this card. */
function dialogOf(card: DeskCard) {
  return card === 'kudos' ? DIALOGS.kudos : DIALOGS.postcard;
}

/** Fetches a card's dialog ahead of a press; a failure is tried again at the press. */
function warm(card: DeskCard) {
  dialogOf(card)
    .fetch()
    .catch(() => {});
}

/** A Kudos the visitor wrote on the desk, pinned to the page's board with what it mentions. */
export type PinnedKudos = LandingKudos & { readonly tags: TextTags };

type LandingPostValue = {
  /** Opens the dialog that writes this card, once its code has arrived. */
  write: (card: DeskCard) => void;
  /** Forgets a card pressed whose dialog is still on its way, so it does not open after all. */
  cancel: () => void;
  warm: (card: DeskCard) => void;
  /** The visitor's own Kudos, newest first. They live only as long as the page does. */
  pinned: readonly PinnedKudos[];
  /** Where the newest pinned Kudos is drawn, so "Go to Kudos board" can take focus to it. */
  newestPinRef: React.RefObject<HTMLLIElement | null>;
};

const LandingPostContext = createContext<LandingPostValue | null>(null);

/** The desk and the board, which share what the visitor writes. */
export function useLandingPost(): LandingPostValue {
  const value = use(LandingPostContext);
  if (!value) {
    throw new Error('useLandingPost is used outside LandingPost.');
  }
  return value;
}

/** A sent Kudos as the board draws it: what it says, who it names, and the card it is on. */
function toPinned(draft: KudosDraft, count: number): PinnedKudos {
  const mentioned = mentionedTeammates(draft.message, LANDING_TEAMMATES);
  return {
    id: `landing-yours-${count}`,
    giver: LANDING_VISITOR,
    recipients: mentioned.map((teammate) => ({
      accountId: teammate.accountId,
      name: teammate.name,
      photoUrl: teammate.photoUrl,
      inactive: false,
    })),
    message: draft.message,
    tags: {
      workspaceGoals: [],
      mentions: mentioned.flatMap((teammate) =>
        teammate.slug === null || teammate.displayName === null
          ? []
          : [{ slug: teammate.slug, displayName: teammate.displayName }],
      ),
    },
    drawing: {
      templateKey: draft.templateKey,
      textStyle: draft.textStyle,
      stickers: draft.stickers.map(({ id: _id, ...sticker }) => sticker),
    },
    givenAt: new Date().toISOString(),
  };
}

export type LandingPostProps = {
  /** The parts of the page between the desk and the board, drawn on the server. */
  children: React.ReactNode;
};

/**
 * Holds what the visitor writes on the desk while they read on: which card is open, and the Kudos
 * they have pinned. Everything between the desk and the board is drawn on the server and handed
 * through as `children`. Nothing here reaches a Workspace: Send resolves at once, a postcard flies
 * off and a toast says nothing went, and a Kudos is pinned to this page's board until it reloads.
 */
export function LandingPost({ children }: LandingPostProps) {
  const [open, setOpen] = useState<DeskCard | null>(null);
  // Each dialog stays mounted once it has been opened, so it can close as it opens: animated, and
  // giving focus back. A postcard is asked or given, so it keeps the kind it was last opened as.
  const [postcardKind, setPostcardKind] = useState<'ask' | 'give' | null>(null);
  const [hasWrittenKudos, setHasWrittenKudos] = useState(false);
  const [pinned, setPinned] = useState<readonly PinnedKudos[]>([]);
  const newestPinRef = useRef<HTMLLIElement>(null);
  const isGoingToBoard = useRef(false);
  // The card pressed last, so a dialog still on its way opens only if nothing was pressed since.
  const pressed = useRef<DeskCard | null>(null);

  // Both dialogs are fetched once the page has drawn and the browser is idle.
  useEffect(
    () =>
      whenIdle(() => {
        warm('kudos');
        warm('ask');
      }),
    [],
  );

  // Stable, as they touch only refs and state setters, so the desk and the board, which read them
  // through the context, are not drawn again each time a dialog opens or closes.
  const write = useCallback((card: DeskCard) => {
    function openIfStillPressed() {
      if (pressed.current !== card) {
        return;
      }
      if (card === 'kudos') {
        setHasWrittenKudos(true);
      } else {
        setPostcardKind(card);
      }
      setOpen(card);
    }
    pressed.current = card;
    if (dialogOf(card).current()) {
      openIfStillPressed();
      return;
    }
    dialogOf(card)
      .fetch()
      .then(openIfStillPressed, () => {});
  }, []);

  const cancel = useCallback(() => {
    pressed.current = null;
  }, []);

  const value = useMemo(
    () => ({ write, cancel, warm, pinned, newestPinRef }),
    [write, cancel, pinned],
  );

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setOpen(null);
    }
  }

  async function handleSendPostcard() {
    toast.success(desk.sent.title, { description: desk.sent.description });
    return true;
  }

  async function handleSendKudos(draft: KudosDraft) {
    setPinned((current) => [toPinned(draft, current.length + 1), ...current]);
    return true;
  }

  function handleGoToBoard() {
    isGoingToBoard.current = true;
    setOpen(null);
  }

  // The dialog gives focus back to the card that opened it, unless the visitor asked for the
  // board: then it goes to their Kudos, pinned there, so the page moves to where they were sent.
  function handleKudosCloseAutoFocus(event: Event) {
    if (!isGoingToBoard.current) {
      return;
    }
    isGoingToBoard.current = false;
    const pin = newestPinRef.current;
    if (pin) {
      event.preventDefault();
      pin.focus({ preventScroll: true });
      // The dialog puts the page's scroll back as it lets go of it, after this runs; scrolling
      // two frames later lands after that, instead of being undone by it.
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          pin.scrollIntoView({
            block: 'center',
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
              .matches
              ? 'auto'
              : 'smooth',
          }),
        ),
      );
    }
  }

  const common = {
    writer: LANDING_WRITER,
    teammates: LANDING_TEAMMATES,
    workspaceGoals: LANDING_WORKSPACE_GOALS,
    onOpenChange: handleOpenChange,
  };

  // Set before either is drawn: `postcardKind` and `hasWrittenKudos` are only set once it arrived.
  const PostcardDialog = DIALOGS.postcard.current();
  const KudosDialog = DIALOGS.kudos.current();

  return (
    <LandingPostContext value={value}>
      {children}
      {postcardKind && PostcardDialog && (
        <PostcardDialog
          {...common}
          // Nothing written here is kept, so there is nothing to ask before throwing it away.
          asksBeforeClosing={false}
          title={desk.dialogTitles[postcardKind]}
          kind={postcardKind}
          open={open === postcardKind}
          onSend={handleSendPostcard}
        />
      )}
      {hasWrittenKudos && KudosDialog && (
        <KudosDialog
          teammates={LANDING_TEAMMATES}
          workspaceGoals={LANDING_WORKSPACE_GOALS}
          open={open === 'kudos'}
          onOpenChange={handleOpenChange}
          onSend={handleSendKudos}
          onGoToBoard={handleGoToBoard}
          onBackToHome={() => setOpen(null)}
          onCloseAutoFocus={handleKudosCloseAutoFocus}
          asksBeforeClosing={false}
        />
      )}
    </LandingPostContext>
  );
}
