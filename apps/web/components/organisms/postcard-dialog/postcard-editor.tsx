import { ArrowRightIcon, Rotate3dIcon, XIcon } from 'lucide-react';
import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';
import { SELECTED_PEOPLE } from '@/components/organisms/visibility-picker';
import { cn } from '@/lib/cn.util';
import { chosenPeople } from '@/lib/feedback/chosen-people.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { Postcard, type PostcardSide } from './postcard';
import styles from './postcard.module.css';
import { PostcardAddress, PostcardFrom } from './postcard-address';
import {
  PostcardCoverNote,
  PostcardCoverToolbar,
} from './postcard-cover-toolbar';
import type {
  PostcardAnswer,
  PostcardAsk,
  PostcardDraft,
  PostcardKind,
  PostcardVisibility,
  PostcardWriter,
} from './postcard-draft.type';
import { PostcardMessage } from './postcard-message';
import {
  PostcardAnswerPlaceholder,
  PostcardAskReadOnly,
  PostcardSplitBack,
} from './postcard-split-back';
import {
  DEFAULT_TEXT_STYLE,
  type PaperTone,
  type PostcardTextStyle,
} from './postcard-style.constant';
import {
  POSTCARD_TEMPLATES,
  randomTemplateKey,
} from './postcard-template.constant';
import { PostcardTextToolbar } from './postcard-text-toolbar';
import { PostcardToolbar } from './postcard-toolbar';

/** One change to the card: some of its fields, or a part of the text's style. */
type DraftChange =
  | { kind: 'card'; fields: Partial<Omit<PostcardDraft, 'textStyle'>> }
  | { kind: 'style'; fields: Partial<PostcardTextStyle> };

function applyChange(draft: PostcardDraft, change: DraftChange): PostcardDraft {
  return change.kind === 'style'
    ? { ...draft, textStyle: { ...draft.textStyle, ...change.fields } }
    : { ...draft, ...change.fields };
}

/** Which card is written, with what only that card needs. */
export type PostcardCard =
  | {
      kind: Exclude<PostcardKind, 'answer'>;
      teammates: readonly Teammate[];
      /** Who it is for as it opens. Read once: the card owns it from then on. */
      defaultRecipientAccountIds: readonly string[];
      onSend: (postcard: PostcardDraft) => void;
    }
  | {
      kind: 'answer';
      ask: PostcardAsk;
      onSend: (answer: PostcardAnswer) => void;
    };

const NO_TEAMMATES: readonly Teammate[] = [];

/** What the bar is called to a screen reader, for whichever tools it holds. */
const BAR_LABELS = {
  text: 'Text style',
  cover: 'Front tools',
  card: 'Postcard tools',
} as const;
/** Nobody: no recipients, the same empty list every render. */
export const NOBODY: readonly string[] = [];

/** The words each card uses, so the three read as one family. */
const COPY: Readonly<
  Record<
    PostcardKind,
    {
      send: string;
      messageLabel: string;
      placeholder: string;
      status: string;
      /** Under the bar while the front shows. */
      coverStatus: string;
      lost: string;
    }
  >
> = {
  give: {
    send: 'Seal & Send',
    messageLabel: 'Your feedback',
    placeholder:
      "Share what you've seen: what went well, and what could go differently next time.",
    status: 'Turn the card over to see the front.',
    coverStatus:
      'The front: choose its picture from Templates. Turn it over to write.',
    lost: 'What you wrote, and who it was for, will be lost.',
  },
  ask: {
    send: 'Send request',
    messageLabel: 'Your request',
    placeholder:
      'What would you like advice on? Think of something you can do differently next time.',
    status: 'Write your request on the left; their answers go on the right.',
    coverStatus:
      'The front: choose its picture from Templates. Turn it over to write.',
    lost: 'What you wrote, and who you asked, will be lost.',
  },
  answer: {
    send: 'Send answer',
    messageLabel: 'Your answer',
    placeholder:
      "Share what you've seen and what could go differently next time.",
    status: 'Write your answer on the right. The left is their request.',
    coverStatus:
      'The front is their picture. Turn it over to write your answer.',
    lost: 'Your answer will be lost.',
  },
};

/** Who is chosen after "To", for the cards that choose: what choosing means, and for whom. */
const RECIPIENTS: Readonly<
  Record<
    Exclude<PostcardKind, 'answer'>,
    { label: string; description: string }
  >
> = {
  give: {
    label: "Choose who it's for",
    description: 'They can always read it.',
  },
  ask: {
    label: 'Choose who to ask',
    description: 'They each answer in their own words.',
  },
};

function blankDraft(card: PostcardCard): PostcardDraft {
  return {
    recipientAccountIds:
      card.kind === 'answer' ? NOBODY : card.defaultRecipientAccountIds,
    message: '',
    visibility: 'ONLY_ME',
    selectedAccountIds: new Set(),
    // A new card opens on any picture; an answer's is the Requester's, which is not kept yet, so
    // every answer shows the first, the same for whoever opens it.
    templateKey:
      card.kind === 'answer' ? POSTCARD_TEMPLATES[0].key : randomTemplateKey(),
    tone: card.kind === 'answer' ? card.ask.tone : 'cream',
    textStyle: DEFAULT_TEXT_STYLE,
  };
}

/**
 * The people picked under Selected people who still count: none under any other choice, and
 * never a Receiver, who reads it anyway. The picker keeps its list while the choice changes, so
 * switching back restores it; this is what is shown as ready and what is handed over.
 */
function selectedReaders(draft: PostcardDraft): ReadonlySet<string> {
  if (draft.visibility !== SELECTED_PEOPLE) {
    return new Set();
  }
  return new Set(
    [...draft.selectedAccountIds].filter(
      (accountId) => !draft.recipientAccountIds.includes(accountId),
    ),
  );
}

function isReady(kind: PostcardKind, draft: PostcardDraft) {
  if (kind === 'answer') {
    return draft.message.trim() !== '';
  }
  return (
    draft.recipientAccountIds.length > 0 &&
    draft.message.trim() !== '' &&
    (draft.visibility !== SELECTED_PEOPLE || selectedReaders(draft).size > 0)
  );
}

/** What has focus, if anything does: the page itself is not somewhere to send focus back to. */
function focusedControl(): HTMLElement | null {
  const focused = document.activeElement;
  return focused instanceof HTMLElement && focused !== document.body
    ? focused
    : null;
}

function isSameList(one: readonly string[], other: readonly string[]) {
  return (
    one.length === other.length && one.every((item) => other.includes(item))
  );
}

export type PostcardEditorProps = {
  title: string;
  writer: PostcardWriter;
  card: PostcardCard;
  /** The writer chose to leave, or the card has been sent: the dialog should close. */
  onClose: () => void;
  onCloseAutoFocus?: (event: Event) => void;
};

/**
 * One opening of `PostcardDialog`: its content and everything written on it, for whichever card
 * it is — given, asked or answered. Mounted afresh for each opening, so nothing carries from one
 * card to the next and nothing has to be reset.
 *
 * Every change goes through one stable `change`, and the parts that typing does not touch — the
 * address, the cover and both bars — are memoised and handed stable callbacks, so a keystroke
 * redraws only this shell, the card's two faces, the message and Send.
 */
export function PostcardEditor({
  title,
  writer,
  card,
  onClose,
  onCloseAutoFocus,
}: PostcardEditorProps) {
  const [draft, change] = useReducer(applyChange, card, blankDraft);
  // The kind is fixed for each editor (the dialog keys it), and only who it is for is read once,
  // as it opens; everything else on `card` is read live, so a caller's newer `onSend` or
  // `teammates` is the one used.
  const { kind } = card;
  const copy = COPY[kind];
  const teammates = card.kind === 'answer' ? NO_TEAMMATES : card.teammates;
  const [openingRecipients] = useState(() =>
    card.kind === 'answer' ? NOBODY : card.defaultRecipientAccountIds,
  );
  const [side, setSide] = useState<PostcardSide>('back');
  const [isEditingText, setIsEditingText] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  // Where focus goes back to: the control that opened the card, and the one that asked to close
  // it. Neither is a `DialogTrigger`, so Radix would otherwise leave focus on the page itself.
  const openerRef = useRef<HTMLElement | null>(null);
  const askedToCloseFromRef = useRef<HTMLElement | null>(null);
  const isLeavingRef = useRef(false);

  // Who can be picked under Selected people, and the Receivers by name: only a new Receiver
  // changes them, so the bar's props stay the same while the message is typed.
  const people = useMemo(
    () =>
      teammates.filter(
        (teammate) => !draft.recipientAccountIds.includes(teammate.accountId),
      ),
    [teammates, draft.recipientAccountIds],
  );
  const recipientNames = useMemo(
    () =>
      chosenPeople(teammates, draft.recipientAccountIds).map(
        (person) => person.name,
      ),
    [teammates, draft.recipientAccountIds],
  );

  const handleRecipientsChange = useCallback(
    (recipientAccountIds: readonly string[]) =>
      change({ kind: 'card', fields: { recipientAccountIds } }),
    [],
  );
  const handleMessageChange = useCallback(
    (message: string) => change({ kind: 'card', fields: { message } }),
    [],
  );
  const handleTemplateChange = useCallback(
    (templateKey: string) => change({ kind: 'card', fields: { templateKey } }),
    [],
  );
  const handleToneChange = useCallback(
    (tone: PaperTone) => change({ kind: 'card', fields: { tone } }),
    [],
  );
  const handleVisibilityChange = useCallback(
    (visibility: PostcardVisibility) =>
      change({ kind: 'card', fields: { visibility } }),
    [],
  );
  const handleSelectedChange = useCallback(
    (selectedAccountIds: ReadonlySet<string>) =>
      change({ kind: 'card', fields: { selectedAccountIds } }),
    [],
  );
  const handleTextStyleChange = useCallback(
    (fields: Partial<PostcardTextStyle>) => change({ kind: 'style', fields }),
    [],
  );
  const handleMessageFocus = useCallback(() => setIsEditingText(true), []);

  // Done takes the text tools away, so the cursor goes to the first of the usual tools that
  // works, or, where none works yet, as on an answer, to the first one, rather than being lost
  // with them.
  const handleDone = useCallback(() => {
    flushSync(() => setIsEditingText(false));
    const tools = toolbarRef.current;
    (
      tools?.querySelector<HTMLElement>('button:not([aria-disabled="true"])') ??
      tools?.querySelector<HTMLElement>('button')
    )?.focus();
  }, []);

  // Anything the writer has done, beyond who the caller already chose it was for.
  const hasWritten =
    draft.message.trim() !== '' ||
    !isSameList(draft.recipientAccountIds, openingRecipients) ||
    selectedReaders(draft).size > 0;

  function askToClose() {
    if (isSending) {
      return;
    }
    askedToCloseFromRef.current = focusedControl();
    setIsConfirmingClose(true);
  }

  function handleFlip() {
    setIsEditingText(false);
    setSide((current) => (current === 'back' ? 'front' : 'back'));
  }

  // The cursor anywhere but the message or the bar leaves the text tools; the bar stops its own
  // focus, menus included, from getting here.
  function handleFocus(event: React.FocusEvent) {
    if (event.target !== messageRef.current) {
      setIsEditingText(false);
    }
  }

  // A press on the bar between its tools takes no focus, so the text tools stay up.
  function handleToolbarMouseDown(event: React.MouseEvent) {
    if (
      event.target instanceof Element &&
      !event.target.closest('button, input, [role="menuitem"]')
    ) {
      event.preventDefault();
    }
  }

  // Escape while styling leaves the text tools; otherwise it asks before closing, like Close.
  function handleEscapeKeyDown(event: KeyboardEvent) {
    event.preventDefault();
    if (isEditingText) {
      setIsEditingText(false);
    } else {
      askToClose();
    }
  }

  // The cursor belongs on the card: on "To" while nobody is chosen, on the message once somebody
  // is. Whatever had it before is the opener, which gets it back on close.
  function handleOpenAutoFocus(event: Event) {
    openerRef.current = focusedControl();
    const target =
      kind !== 'answer' && draft.recipientAccountIds.length === 0
        ? contentRef.current?.querySelector('section:not([inert]) button')
        : messageRef.current;
    if (target instanceof HTMLElement) {
      event.preventDefault();
      target.focus();
    }
  }

  // The caller may send focus somewhere of its own; otherwise it goes back to the opener, if
  // that is still on the page.
  function handleCloseAutoFocus(event: Event) {
    onCloseAutoFocus?.(event);
    if (event.defaultPrevented) {
      return;
    }
    event.preventDefault();
    if (openerRef.current?.isConnected) {
      openerRef.current.focus();
    }
  }

  // Keep writing puts the cursor back where it was. Discard leaves it to the card's own close.
  function handleConfirmCloseAutoFocus(event: Event) {
    event.preventDefault();
    if (isLeavingRef.current) {
      return;
    }
    const back = askedToCloseFromRef.current?.isConnected
      ? askedToCloseFromRef.current
      : messageRef.current;
    back?.focus();
  }

  function handleDiscard() {
    isLeavingRef.current = true;
    setIsConfirmingClose(false);
    onClose();
  }

  // The card is handed over at the press, so sending never waits on an animation (a tab in the
  // background may not run one). It then flies off, and the dialog closes once the flight has
  // settled: ended, or cut short, as when reduced motion is switched on mid-way. With reduced
  // motion there is no flight, and it closes at once.
  function handleSend() {
    if (card.kind === 'answer') {
      card.onSend({ message: draft.message, textStyle: draft.textStyle });
    } else {
      card.onSend({ ...draft, selectedAccountIds: selectedReaders(draft) });
    }
    // The card goes inert as it flies, which would drop focus from Send onto the page; the
    // dialog itself holds it until the opener gets it back. It is a container, not a control,
    // so it draws no focus ring while it does.
    contentRef.current?.focus();
    flushSync(() => {
      setIsEditingText(false);
      setIsSending(true);
    });
    const flight = cardRef.current?.getAnimations?.() ?? [];
    // Only if this card is still on the page: one closed and opened again meanwhile is a new card.
    void Promise.allSettled(flight.map((animation) => animation.finished)).then(
      () => {
        if (cardRef.current?.isConnected) {
          onClose();
        }
      },
    );
  }

  // The bar holds the text's tools while the message is styled, the front's while the front shows,
  // and the card's own otherwise.
  const bar = isEditingText ? 'text' : side === 'front' ? 'cover' : 'card';
  const status = {
    text: 'Pick a style for your words. Done or Esc when you have finished.',
    cover: copy.coverStatus,
    card: copy.status,
  }[bar];

  // The message is the same field on every card: ruled like a letter, except a request, which is
  // printed stationery. The cards that choose who it is for put it under From and To.
  const message = (
    <PostcardMessage
      ref={messageRef}
      message={draft.message}
      textStyle={draft.textStyle}
      label={copy.messageLabel}
      placeholder={copy.placeholder}
      isRuled={kind !== 'ask'}
      onMessageChange={handleMessageChange}
      onMessageFocus={handleMessageFocus}
    />
  );
  const address = card.kind !== 'answer' && (
    <PostcardAddress
      writer={writer}
      teammates={teammates}
      recipientAccountIds={draft.recipientAccountIds}
      recipientsLabel={RECIPIENTS[card.kind].label}
      recipientsDescription={RECIPIENTS[card.kind].description}
      onRecipientsChange={handleRecipientsChange}
    />
  );
  let back: React.ReactNode;
  if (card.kind === 'answer') {
    back = (
      <PostcardSplitBack
        ask={<PostcardAskReadOnly ask={card.ask} />}
        answer={
          <>
            <PostcardFrom writer={writer} />
            {message}
          </>
        }
      />
    );
  } else if (card.kind === 'ask') {
    back = (
      <PostcardSplitBack
        ask={
          <>
            {address}
            {message}
          </>
        }
        answer={<PostcardAnswerPlaceholder />}
      />
    );
  } else {
    back = (
      <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 pt-5 pb-5 md:px-8 md:pt-7 md:pb-7">
        {address}
        {message}
      </div>
    );
  }

  return (
    // The whole screen is the dialog, so a card taller than the window scrolls rather than being
    // cut off. Nothing outside it can close it: every way out asks first.
    <DialogContent
      ref={contentRef}
      hasCloseButton={false}
      aria-describedby={undefined}
      onOpenAutoFocus={handleOpenAutoFocus}
      onCloseAutoFocus={handleCloseAutoFocus}
      onEscapeKeyDown={handleEscapeKeyDown}
      onInteractOutside={(event) => event.preventDefault()}
      onFocus={handleFocus}
      className="inset-0 top-0 mx-0 max-h-none max-w-none translate-y-0 gap-0 overflow-y-auto rounded-none border-0 bg-transparent p-4 shadow-none focus-visible:outline-hidden md:p-8"
    >
      {/* Wider than the card, so the text tools fit on one line beside Seal & Send. A card that
          has been sent is inert while it flies off, so nothing edits what has gone. */}
      <div
        inert={isSending}
        className="mx-auto my-auto flex w-full max-w-5xl flex-col items-center gap-4"
      >
        <div className="flex w-full max-w-2xl items-center gap-2">
          <DialogTitle className="flex-1 text-subtitle-display-1">
            {title}
          </DialogTitle>
          <Button variant="secondary" size="icon" onClick={askToClose}>
            <XIcon aria-hidden="true" className="size-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Beside the card where there is room, so it never covers the writing; above it on a
            narrow screen. */}
        <div className="relative flex w-full max-w-2xl flex-col gap-3">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleFlip}
            className="self-end shadow-med lg:absolute lg:top-1/2 lg:left-full lg:ml-6 lg:-translate-y-1/2"
          >
            <Rotate3dIcon aria-hidden="true" className="size-4.5" />
            <span className="sr-only">
              {side === 'back'
                ? 'Turn over to the front, the picture'
                : 'Turn over to the back, the message'}
            </span>
          </Button>
          <div ref={cardRef} className={cn(isSending && styles.sendAway)}>
            <Postcard
              side={side}
              tone={draft.tone}
              templateKey={draft.templateKey}
            >
              {back}
            </Postcard>
          </div>
        </div>

        <p
          aria-live="polite"
          className="max-w-2xl text-center text-body-3 text-fg-secondary"
        >
          {status}
        </p>

        <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:items-stretch sm:justify-center">
          {/* The bar's own focus, its menus' included, keeps the text tools up. */}
          {/* biome-ignore lint/a11y/useSemanticElements: `<fieldset>` groups form fields under a legend; a row of tools is a plain named group. */}
          <div
            ref={toolbarRef}
            role="group"
            aria-label={
              bar === 'cover' && kind === 'answer' ? 'Front' : BAR_LABELS[bar]
            }
            onFocus={(event) => event.stopPropagation()}
            onMouseDown={handleToolbarMouseDown}
            className="flex max-w-full items-center rounded-control border border-border-muted bg-surface-raised p-1.5 shadow-high"
          >
            <div
              key={bar}
              className="flex flex-wrap items-center justify-center gap-0.5 motion-safe:animate-enter"
            >
              {bar === 'text' ? (
                <PostcardTextToolbar
                  textStyle={draft.textStyle}
                  onTextStyleChange={handleTextStyleChange}
                  onDone={handleDone}
                />
              ) : bar === 'cover' ? (
                card.kind === 'answer' ? (
                  <PostcardCoverNote ownerName={card.ask.requester.name} />
                ) : (
                  <PostcardCoverToolbar
                    templateKey={draft.templateKey}
                    onTemplateChange={handleTemplateChange}
                  />
                )
              ) : (
                <PostcardToolbar
                  kind={kind}
                  tone={draft.tone}
                  visibility={draft.visibility}
                  people={people}
                  selectedAccountIds={draft.selectedAccountIds}
                  recipientNames={recipientNames}
                  onToneChange={handleToneChange}
                  onVisibilityChange={handleVisibilityChange}
                  onSelectedChange={handleSelectedChange}
                />
              )}
            </div>
          </div>
          <Button
            variant="primary"
            disabled={isSending || !isReady(kind, draft)}
            onClick={handleSend}
            className="h-auto shrink-0 rounded-control shadow-high"
          >
            {copy.send}
            <ArrowRightIcon aria-hidden="true" className="size-4.5" />
          </Button>
        </div>
      </div>

      <Dialog open={isConfirmingClose} onOpenChange={setIsConfirmingClose}>
        <DialogContent
          hasCloseButton={false}
          onCloseAutoFocus={handleConfirmCloseAutoFocus}
        >
          <DialogHeader>
            <DialogTitle>Close without sending?</DialogTitle>
            <DialogDescription>
              {hasWritten ? copy.lost : 'Nothing on this card will be kept.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button>Keep writing</Button>
            </DialogClose>
            <Button variant="danger" onClick={handleDiscard}>
              {hasWritten ? 'Discard' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogContent>
  );
}
