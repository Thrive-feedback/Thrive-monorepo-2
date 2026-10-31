import { ArrowRightIcon } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
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
import { feedbackTagTriggers } from '@/components/organisms/feedback-tag-triggers.util';
import { SELECTED_PEOPLE } from '@/components/organisms/visibility-picker';
import { cn } from '@/lib/cn.util';
import { chosenPeople } from '@/lib/feedback/chosen-people.util';
import { useMentionedAudience } from '@/lib/feedback/use-mentioned-audience';
import { Postcard } from './postcard';
import styles from './postcard.module.css';
import { PostcardBack } from './postcard-back';
import { PostcardContrail } from './postcard-contrail';
import {
  PostcardCoverNote,
  PostcardCoverToolbar,
} from './postcard-cover-toolbar';
import type {
  PostcardCard,
  PostcardSide,
  PostcardWriter,
} from './postcard-draft.type';
import {
  applyChange,
  blankDraft,
  isReady,
  NOBODY,
} from './postcard-draft.util';
import {
  BAR_LABELS,
  COPY,
  POSTCARD_BAR,
  POSTCARD_CARD_ACTIONS,
  POSTCARD_CARD_COLUMN,
  POSTCARD_PAGE,
  POSTCARD_SCREEN,
  SENT_AWAY,
  STAMP_ID,
} from './postcard-editor.constant';
import { focusedControl } from './postcard-focus.util';
import { PostcardHideButton } from './postcard-hide-button';
import { PostcardMessage } from './postcard-message';
import { PostcardPostmark } from './postcard-postmark';
import {
  PostcardStamp,
  PostcardStampBox,
  PostcardStampReadOnly,
} from './postcard-stamp';
import {
  PostcardSticker,
  type PostcardStickerChange,
  PostcardStickersReadOnly,
} from './postcard-sticker';
import type { PaperTone, PostcardTextStyle } from './postcard-style.constant';
import { PostcardTextToolbar } from './postcard-text-toolbar';
import { PostcardTitleRow } from './postcard-title-row';
import { PostcardToolbar } from './postcard-toolbar';
import { PostcardTurnButton } from './postcard-turn-button';
import { PostcardVisibilityTool } from './postcard-visibility-tool';
import { PostcardDrawerContainer } from './use-postcard-drawer-container';
import { usePostcardOpener } from './use-postcard-opener';
import { usePostcardSend } from './use-postcard-send';

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
 * address, the front, the stamp, the stickers and the text tools — are memoised and handed stable
 * callbacks, so a keystroke redraws only this shell, the card's two faces, the message and the bar
 * showing. A sticker dragged redraws none of this: it hands on where it ended.
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
  const { teammates, workspaceGoals } = card;
  const [openingRecipients] = useState(() =>
    card.kind === 'answer' ? NOBODY : card.defaultRecipientAccountIds,
  );
  const [isEditingText, setIsEditingText] = useState(false);
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  // The sticker selected, or `STAMP_ID` for the stamp: one thing on the card at a time.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Held here because the Stamp tool and the printed box both open it.
  const [isStampPickerOpen, setIsStampPickerOpen] = useState(false);
  const [areStickersHidden, setAreStickersHidden] = useState(false);
  const stickersAddedRef = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<HTMLButtonElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const { noteOpener, giveFocusBack } = usePostcardOpener();
  // Where focus goes back to if the writer keeps writing: nothing here is a `DialogTrigger` either.
  const askedToCloseFromRef = useRef<HTMLElement | null>(null);
  const isLeavingRef = useRef(false);

  // The same rules as the composer on Home: who the text mentions decides who can read it.
  const audience = useMentionedAudience({
    message: draft.message,
    teammates,
    readsAnyway: draft.recipientAccountIds,
  });
  const triggers = useMemo(
    () => feedbackTagTriggers(workspaceGoals, teammates),
    [workspaceGoals, teammates],
  );

  // Who can be picked under Selected people. Whoever Feedback is for reads it anyway, so they are
  // not among them; the people asked can be, because selecting one lets them read the others'
  // answers, which is the Requester's call. Only the Receivers change this, so the bar's props stay
  // the same while the message is typed.
  const people = useMemo(
    () =>
      kind === 'give'
        ? teammates.filter(
            (teammate) =>
              !draft.recipientAccountIds.includes(teammate.accountId),
          )
        : teammates,
    [kind, teammates, draft.recipientAccountIds],
  );
  // The people picked who still count: none under any other choice, and only who can be picked.
  const selectedReaders: ReadonlySet<string> = new Set(
    audience.visibility === SELECTED_PEOPLE
      ? people
          .filter((person) => audience.selectedAccountIds.has(person.accountId))
          .map((person) => person.accountId)
      : [],
  );
  const recipientNames = useMemo(
    () =>
      chosenPeople(teammates, draft.recipientAccountIds).map(
        (person) => person.name,
      ),
    [teammates, draft.recipientAccountIds],
  );

  function handOver() {
    return card.kind === 'answer'
      ? card.onSend({
          message: draft.message,
          stickers: draft.stickers,
          textStyle: draft.textStyle,
        })
      : card.onSend({
          ...draft,
          visibility: audience.visibility,
          selectedAccountIds: selectedReaders,
        });
  }
  const {
    side,
    status: sendStatus,
    flight,
    turnOver,
    handleTurned,
    send,
  } = usePostcardSend({
    handOver,
    onLetGo: () => setSelectedId(null),
    containerRef: contentRef,
    sendRef,
    onSent: onClose,
  });
  const isFlying = sendStatus === 'flying';

  const handleRecipientsChange = useCallback(
    (recipientAccountIds: readonly string[]) =>
      change({ kind: 'card', fields: { recipientAccountIds } }),
    [],
  );
  function handleMessageChange(message: string) {
    audience.noteMessage(message);
    change({ kind: 'card', fields: { message } });
  }
  const handleTemplateChange = useCallback(
    (templateKey: string) => change({ kind: 'card', fields: { templateKey } }),
    [],
  );
  const handleToneChange = useCallback(
    (tone: PaperTone) => change({ kind: 'card', fields: { tone } }),
    [],
  );
  const handleTextStyleChange = useCallback(
    (fields: Partial<PostcardTextStyle>) => change({ kind: 'style', fields }),
    [],
  );
  const handleMessageFocus = useCallback(() => {
    setIsEditingText(true);
    setIsStampPickerOpen(false);
  }, []);

  // A new sticker goes on the side showing, selected, so it can be moved straight away, which takes
  // the others being on show too. The bar refuses a fourth; were one to get through, it would select
  // nothing.
  const handleAddSticker = useCallback(
    (stickerKey: string) => {
      stickersAddedRef.current += 1;
      const id = `sticker-${stickersAddedRef.current}`;
      change({ kind: 'addSticker', id, stickerKey, side });
      setSelectedId(id);
      setAreStickersHidden(false);
    },
    [side],
  );
  const handleChangeSticker = useCallback(
    (id: string, fields: PostcardStickerChange) =>
      change({ kind: 'changeSticker', id, fields }),
    [],
  );
  // A sticker taken off takes the cursor with it, so it goes to Stickers, where another can be added.
  const handleRemoveSticker = useCallback((id: string) => {
    change({ kind: 'removeSticker', id });
    setSelectedId((current) => (current === id ? null : current));
    toolbarRef.current
      ?.querySelector<HTMLElement>('[data-stickers-tool]')
      ?.focus();
  }, []);

  // A stamp chosen is selected, so what it can do shows straight away.
  const handleStampChange = useCallback((stampKey: string) => {
    change({ kind: 'card', fields: { stampKey } });
    setSelectedId(STAMP_ID);
  }, []);
  const handleSelectStamp = useCallback(() => setSelectedId(STAMP_ID), []);
  // The box printed for a stamp opens the same drawer as Stamp, which is on the usual bar.
  const handleChooseStamp = useCallback(() => {
    setIsEditingText(false);
    setSelectedId(null);
    setIsStampPickerOpen(true);
  }, []);
  // As with a sticker, the cursor goes to the tool that puts one back.
  const handleRemoveStamp = useCallback(() => {
    change({ kind: 'card', fields: { stampKey: null } });
    setSelectedId((current) => (current === STAMP_ID ? null : current));
    toolbarRef.current
      ?.querySelector<HTMLElement>('[data-stamp-tool]')
      ?.focus();
  }, []);

  // A press on anything but a sticker, the stamp or their drawers lets go of what was selected.
  // Listened for only while one is: the editor stays mounted after the card closes.
  useEffect(() => {
    if (selectedId === null) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Element &&
        event.target.closest(
          '[data-sticker], [data-stamp], [data-sticker-panel], [data-stamp-panel]',
        )
      ) {
        return;
      }
      setSelectedId(null);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [selectedId]);

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
    selectedReaders.size > 0 ||
    draft.stickers.length > 0 ||
    draft.stampKey !== null;

  function askToClose() {
    if (sendStatus !== 'writing') {
      return;
    }
    askedToCloseFromRef.current = focusedControl();
    setIsConfirmingClose(true);
  }

  function handleFlip() {
    setIsEditingText(false);
    setSelectedId(null);
    setIsStampPickerOpen(false);
    turnOver();
  }

  // A key press reaches none of the listeners that let go of a selected sticker, and it would stay
  // selected out of sight.
  function handleHideStickers() {
    setAreStickersHidden((current) => !current);
    setSelectedId(null);
  }

  // The stickers go with the card whether they are showing or not, so the card that flies shows them.
  function handleSend() {
    setAreStickersHidden(false);
    void send();
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
    // The suggestions for a tag being typed close first, by the field's own handler.
    if (messageRef.current?.hasAttribute('aria-controls')) {
      return;
    }
    // An open drawer takes Escape for itself: Radix hears it first, and would ask to close the card.
    if (
      contentRef.current?.querySelector('[data-slot="drawer-popup"][data-open]')
    ) {
      return;
    }
    if (isEditingText) {
      setIsEditingText(false);
    } else {
      askToClose();
    }
  }

  // The cursor belongs on the card: on "To" while nobody is chosen, on the message once somebody
  // is. Whatever had it before is the opener, which gets it back on close.
  function handleOpenAutoFocus(event: Event) {
    noteOpener();
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
    if (!event.defaultPrevented) {
      giveFocusBack(event);
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

  // Leaving lets go of anything selected too, so its page-wide listener goes with the card; the editor
  // stays mounted after the card closes.
  function handleDiscard() {
    isLeavingRef.current = true;
    setIsConfirmingClose(false);
    setSelectedId(null);
    onClose();
  }

  // Beside Send on either side, so who can read it is never a turn away from sending.
  const visibilityTool = card.kind !== 'answer' && (
    <PostcardVisibilityTool
      kind={card.kind}
      value={audience.visibility}
      people={people}
      selectedAccountIds={audience.selectedAccountIds}
      recipientNames={recipientNames}
      note={audience.notice ?? audience.lockedReason}
      isOnlyMeDisabled={audience.onlyMeDisabled}
      lockedPeople={audience.lockedPeople}
      onValueChange={audience.choose}
      onSelectedChange={audience.select}
    />
  );

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
      triggers={triggers}
      label={copy.messageLabel}
      placeholder={copy.placeholder}
      isRuled={kind !== 'ask'}
      onMessageChange={handleMessageChange}
      onMessageFocus={handleMessageFocus}
    />
  );
  // The stickers a Requester stuck on a side, under whatever is stuck on while answering.
  function theirStickersOn(stickerSide: PostcardSide) {
    return (
      card.kind === 'answer' && (
        <PostcardStickersReadOnly
          key="theirs"
          stickers={card.ask.stickers}
          side={stickerSide}
        />
      )
    );
  }

  const hasStickers =
    draft.stickers.length > 0 ||
    (card.kind === 'answer' && card.ask.stickers.length > 0);

  // Each side's stickers, drawn on that side above the writing.
  function stickersOn(stickerSide: PostcardSide) {
    return draft.stickers
      .filter((sticker) => sticker.side === stickerSide)
      .map((sticker) => (
        <PostcardSticker
          key={sticker.id}
          sticker={sticker}
          isSelected={sticker.id === selectedId}
          onSelect={setSelectedId}
          onChange={handleChangeSticker}
          onRemove={handleRemoveSticker}
        />
      ));
  }

  // An answer is written on the Requester's card, so its corner holds their stamp, if any.
  const stamp =
    card.kind === 'answer' ? (
      card.ask.stampKey && (
        <PostcardStampReadOnly stampKey={card.ask.stampKey} />
      )
    ) : draft.stampKey ? (
      <PostcardStamp
        stampKey={draft.stampKey}
        isSelected={selectedId === STAMP_ID}
        onSelect={handleSelectStamp}
        onRemove={handleRemoveStamp}
      />
    ) : (
      <PostcardStampBox onChoose={handleChooseStamp} />
    );

  return (
    // Nothing outside it can close it: every way out asks first. Its drawers are rendered inside it
    // (ADR 0066), and it has no transform, so their sheet stays fixed to the window.
    <PostcardDrawerContainer value={contentRef}>
      <DialogContent
        ref={contentRef}
        hasCloseButton={false}
        aria-describedby={undefined}
        onOpenAutoFocus={handleOpenAutoFocus}
        onCloseAutoFocus={handleCloseAutoFocus}
        onEscapeKeyDown={handleEscapeKeyDown}
        onInteractOutside={(event) => event.preventDefault()}
        onFocus={handleFocus}
        overlayClassName={styles.scrim}
        className={POSTCARD_SCREEN}
      >
        {/* Under everything, so the card flies over its own contrail; it scrolls with the card. The
          card leaves past the right edge, which hides rather than scrolls. */}
        <PostcardContrail ref={flight.contrailRef} course={flight.contrail} />
        {/* A card that has been sent is inert while it flies off, so nothing edits what has gone. */}
        <div inert={sendStatus !== 'writing'} className={POSTCARD_PAGE}>
          <PostcardTitleRow
            title={title}
            onClose={askToClose}
            className={cn(isFlying && SENT_AWAY)}
          />

          <div className={POSTCARD_CARD_COLUMN}>
            <div className={cn(POSTCARD_CARD_ACTIONS, isFlying && SENT_AWAY)}>
              <PostcardTurnButton
                side={side}
                turnToBackHint="Turn over to write on the back"
                onClick={handleFlip}
              />
              <PostcardHideButton
                isHidden={areStickersHidden}
                what="stickers"
                disabled={!hasStickers}
                onClick={handleHideStickers}
              />
            </div>
            <div ref={flight.cardRef} className="relative">
              <Postcard
                side={side}
                tone={draft.tone}
                templateKey={draft.templateKey}
                onTurned={handleTurned}
                stickers={{
                  front: [theirStickersOn('front'), stickersOn('front')],
                  back: [theirStickersOn('back'), stickersOn('back')],
                }}
                areStickersHidden={areStickersHidden}
                stamp={stamp}
              >
                <PostcardBack
                  card={card}
                  writer={writer}
                  recipientAccountIds={draft.recipientAccountIds}
                  message={message}
                  onRecipientsChange={handleRecipientsChange}
                />
              </Postcard>
              {flight.isPostmarked && <PostcardPostmark />}
            </div>
          </div>

          <p
            aria-live="polite"
            className={cn(
              'max-w-2xl text-center text-body-3 text-fg-secondary',
              isFlying && SENT_AWAY,
            )}
          >
            {status}
          </p>

          <div
            className={cn(
              'flex w-full flex-col items-center gap-3 sm:flex-row sm:items-stretch sm:justify-center',
              isFlying && SENT_AWAY,
            )}
          >
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
              className={POSTCARD_BAR}
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
                      stickerCount={draft.stickers.length}
                      onTemplateChange={handleTemplateChange}
                      onAddSticker={handleAddSticker}
                    />
                  )
                ) : (
                  <PostcardToolbar
                    kind={kind}
                    tone={draft.tone}
                    stickerCount={draft.stickers.length}
                    stampKey={draft.stampKey}
                    isStampPickerOpen={isStampPickerOpen}
                    onToneChange={handleToneChange}
                    onAddSticker={handleAddSticker}
                    onStampChange={handleStampChange}
                    onStampPickerOpenChange={setIsStampPickerOpen}
                  />
                )}
              </div>
            </div>
            {bar !== 'text' && (
              <div
                className={cn(
                  POSTCARD_BAR,
                  'flex-wrap justify-center gap-1.5 motion-safe:animate-enter',
                )}
              >
                {visibilityTool}
                <Button
                  variant="primary"
                  ref={sendRef}
                  loading={sendStatus === 'posting'}
                  disabled={
                    isFlying ||
                    !isReady(kind, draft, audience.visibility, selectedReaders)
                  }
                  onClick={handleSend}
                  className="min-h-11"
                >
                  {copy.send}
                  <ArrowRightIcon aria-hidden="true" className="size-4.5" />
                </Button>
              </div>
            )}
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
    </PostcardDrawerContainer>
  );
}
