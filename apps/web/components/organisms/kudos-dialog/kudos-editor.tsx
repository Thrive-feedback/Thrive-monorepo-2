import { ArrowRightIcon } from 'lucide-react';
import {
  memo,
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import { Button } from '@/components/atoms/button';
import { DialogContent } from '@/components/atoms/dialog';
import { feedbackTagTriggers } from '@/components/organisms/feedback-tag-triggers.util';
import {
  POSTCARD_BAR,
  POSTCARD_PAGE,
  POSTCARD_SCREEN,
  SENT_AWAY,
} from '@/components/organisms/postcard-dialog/postcard-editor.constant';
import { isEscapeTakenInside } from '@/components/organisms/postcard-dialog/postcard-focus.util';
import { PostcardHideButton } from '@/components/organisms/postcard-dialog/postcard-hide-button';
import {
  PostcardLeaveDialog,
  usePostcardLeave,
} from '@/components/organisms/postcard-dialog/postcard-leave-dialog';
import {
  PostcardSticker,
  type PostcardStickerChange,
} from '@/components/organisms/postcard-dialog/postcard-sticker';
import { PostcardStickerPicker } from '@/components/organisms/postcard-dialog/postcard-sticker-picker';
import { CardTextToolbar } from '@/components/organisms/postcard-dialog/postcard-text-toolbar';
import { PostcardTitleRow } from '@/components/organisms/postcard-dialog/postcard-title-row';
import { PostcardDrawerContainer } from '@/components/organisms/postcard-dialog/use-postcard-drawer-container';
import { usePostcardOpener } from '@/components/organisms/postcard-dialog/use-postcard-opener';
import { usePressAway } from '@/components/organisms/postcard-dialog/use-press-away';
import { cn } from '@/lib/cn.util';
import { MAX_KUDOS_LENGTH } from '@/lib/feedback/kudos-item.type';
import { mentionedTeammates } from '@/lib/feedback/mentioned-teammates.util';
import { messageLength } from '@/lib/feedback/message-length.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { KudosCardFace } from './kudos-card-face';
import type { KudosDraft } from './kudos-draft.type';
import { applyKudosChange, blankKudosDraft } from './kudos-draft.util';
import { KudosMessage } from './kudos-message';
import { KudosPin, KudosPinActions, KudosPinBoard } from './kudos-pin-board';
import {
  KUDOS_TEMPLATES,
  type KudosInk,
  type KudosTemplateKey,
  type KudosTextStyle,
} from './kudos-template.constant';
import { KudosTemplatePicker } from './kudos-template-picker';
import { useKudosSend } from './use-kudos-send';

/** The bar's tools while the words are styled. Memoised: typing changes none of its props. */
const KudosTextToolbar = memo(CardTextToolbar<KudosInk>);

const NAMES = new Intl.ListFormat('en-GB', {
  style: 'long',
  type: 'conjunction',
});

const WHO_READS = 'Everyone in your Workspace reads a Kudos.';
const FOR_EVERYONE =
  'For everyone in your Workspace. Name a teammate with @ to thank them by name.';
const STICKER_HINT =
  'Up to three on your card. Drag a sticker where you like, or hide them to read what is under them.';

export type KudosEditorProps = {
  title: string;
  teammates: readonly Teammate[];
  workspaceGoals: readonly string[];
  /** What is already written as it opens. Read once: the card owns it from then on. */
  defaultMessage: string;
  onSend: (kudos: KudosDraft) => Promise<boolean>;
  /** The writer chose to leave, or went back to Home from the board: the dialog should close. */
  onClose: () => void;
  onCloseAutoFocus?: (event: Event) => void;
};

/**
 * One opening of `KudosDialog`: everything written on the card. Mounted afresh for each opening, so
 * nothing carries from one card to the next. It has no address and no Visibility: who it is for is
 * whoever the words mention, or the whole Workspace if they mention nobody, and every Member reads
 * it.
 */
export function KudosEditor({
  title,
  teammates,
  workspaceGoals,
  defaultMessage,
  onSend,
  onClose,
  onCloseAutoFocus,
}: KudosEditorProps) {
  const [draft, change] = useReducer(
    applyKudosChange,
    defaultMessage,
    blankKudosDraft,
  );
  const [isEditingText, setIsEditingText] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [areStickersHidden, setAreStickersHidden] = useState(false);
  const stickersAddedRef = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<HTMLButtonElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const backToHomeRef = useRef<HTMLButtonElement>(null);
  const { noteOpener, giveFocusBack } = usePostcardOpener();

  const letGo = useCallback(() => setSelectedId(null), []);
  const { status, pin, send } = useKudosSend({
    handOver: () => onSend(draft),
    onLetGo: letGo,
    containerRef: contentRef,
    sendRef,
    onPinned: () => backToHomeRef.current?.focus(),
  });
  const hasGone = status === 'pinning' || status === 'pinned';
  const { askToClose, leaveDialog } = usePostcardLeave({
    isWriting: status === 'writing',
    fallbackRef: messageRef,
    onLeave: () => {
      setSelectedId(null);
      onClose();
    },
  });
  usePressAway(
    selectedId !== null,
    '[data-sticker], [data-sticker-panel]',
    letGo,
  );

  const triggers = useMemo(
    () => feedbackTagTriggers(workspaceGoals, teammates),
    [workspaceGoals, teammates],
  );
  const recipients = mentionedTeammates(draft.message, teammates);
  const isReady = draft.message.trim() !== '';

  function handleMessageChange(message: string) {
    change({ kind: 'message', message });
  }
  const handleMessageFocus = useCallback(() => setIsEditingText(true), []);
  const handleTemplateChange = useCallback(
    (templateKey: KudosTemplateKey) =>
      change({ kind: 'template', templateKey }),
    [],
  );
  const handleTextStyleChange = useCallback(
    (fields: Partial<KudosTextStyle>) => change({ kind: 'style', fields }),
    [],
  );

  // A new sticker goes on selected, so it can be moved straight away, which takes the others being
  // on show too.
  const handleAddSticker = useCallback((stickerKey: string) => {
    stickersAddedRef.current += 1;
    const id = `sticker-${stickersAddedRef.current}`;
    change({ kind: 'addSticker', id, stickerKey });
    setSelectedId(id);
    setAreStickersHidden(false);
  }, []);
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

  // Done takes the text tools away, so the cursor goes to the first of the usual tools.
  const handleDone = useCallback(() => {
    flushSync(() => setIsEditingText(false));
    toolbarRef.current?.querySelector<HTMLElement>('button')?.focus();
  }, []);

  // A key press reaches none of the listeners that let go of a selected sticker, and it would stay
  // selected out of sight.
  function handleHideStickers() {
    setAreStickersHidden((current) => !current);
    setSelectedId(null);
  }

  // The stickers go with the card whether they are showing or not, so the card pinned shows them.
  function handleSend() {
    setAreStickersHidden(false);
    void send();
  }

  // The cursor anywhere but the message or the bars leaves the text tools; those stop their own
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
      !event.target.closest('button, input, label, [role="menuitem"]')
    ) {
      event.preventDefault();
    }
  }

  // Escape while styling leaves the text tools; otherwise it asks before closing, like Close. Once
  // the card is on the board there is nothing to lose, so it goes back to Home.
  function handleEscapeKeyDown(event: KeyboardEvent) {
    event.preventDefault();
    if (status === 'pinned') {
      onClose();
      return;
    }
    if (isEscapeTakenInside(messageRef.current, contentRef.current)) {
      return;
    }
    if (isEditingText) {
      setIsEditingText(false);
    } else {
      askToClose();
    }
  }

  // The cursor belongs on the card. Whatever had it before is the opener, which gets it back on close.
  function handleOpenAutoFocus(event: Event) {
    noteOpener();
    if (messageRef.current) {
      event.preventDefault();
      messageRef.current.focus();
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

  return (
    // Nothing outside it can close it: every way out asks first. Its drawers are rendered inside it
    // (ADR 0066), and it has no transform, so the board and their sheet stay fixed to the window.
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
        className={POSTCARD_SCREEN}
      >
        {pin.isOnBoard && (
          <KudosPinBoard ref={pin.boardRef} isSettled={status === 'pinned'} />
        )}
        {status === 'pinned' && (
          <KudosPinActions ref={backToHomeRef} onBackToHome={onClose} />
        )}
        {/* A card that has been sent is inert from then on, so nothing edits what has gone. */}
        <div inert={status !== 'writing'} className={POSTCARD_PAGE}>
          <PostcardTitleRow
            title={title}
            onClose={askToClose}
            className={cn('max-w-90', hasGone && SENT_AWAY)}
          />

          <div className="relative flex w-full max-w-90 flex-col gap-3">
            <div
              className={cn(
                'flex gap-2 self-end lg:absolute lg:top-1/2 lg:left-full lg:ml-6 lg:-translate-y-1/2 lg:flex-col',
                hasGone && SENT_AWAY,
              )}
            >
              <PostcardHideButton
                isHidden={areStickersHidden}
                what="stickers"
                disabled={draft.stickers.length === 0}
                onClick={handleHideStickers}
              />
            </div>
            <div ref={pin.cardRef} className="relative">
              <KudosCardFace templateKey={draft.templateKey}>
                <KudosMessage
                  ref={messageRef}
                  message={draft.message}
                  templateKey={draft.templateKey}
                  textStyle={draft.textStyle}
                  triggers={triggers}
                  onMessageChange={handleMessageChange}
                  onMessageFocus={handleMessageFocus}
                />
                {!areStickersHidden &&
                  draft.stickers.map((sticker) => (
                    <PostcardSticker
                      key={sticker.id}
                      sticker={sticker}
                      isSelected={sticker.id === selectedId}
                      onSelect={setSelectedId}
                      onChange={handleChangeSticker}
                      onRemove={handleRemoveSticker}
                    />
                  ))}
              </KudosCardFace>
              <KudosPin ref={pin.pinRef} />
            </div>
          </div>

          <p
            className={cn(
              'flex w-full max-w-90 items-baseline gap-3 text-body-3 text-fg-secondary',
              hasGone && SENT_AWAY,
            )}
          >
            <span aria-live="polite" className="min-w-0 flex-1">
              {recipients.length > 0
                ? `For ${NAMES.format(recipients.map(({ name }) => name))}. ${WHO_READS}`
                : FOR_EVERYONE}
            </span>
            {/* Read out by nobody: it changes on every keystroke, and the field says its limit. */}
            <span aria-hidden="true" className="shrink-0 tabular-nums">
              {messageLength(draft.message)}/{MAX_KUDOS_LENGTH}
            </span>
          </p>

          {/* The bars' own focus, their menus' included, keeps the text tools up. */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: it only watches focus passing through; every control in it is its own. */}
          <div
            onFocus={(event) => event.stopPropagation()}
            onMouseDown={handleToolbarMouseDown}
            className={cn(
              'flex w-full max-w-full flex-col items-center gap-3',
              hasGone && SENT_AWAY,
            )}
          >
            <KudosTemplatePicker
              templateKey={draft.templateKey}
              onTemplateChange={handleTemplateChange}
            />
            <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:items-stretch sm:justify-center">
              {/* biome-ignore lint/a11y/useSemanticElements: `<fieldset>` groups form fields under a legend; a row of tools is a plain named group. */}
              <div
                ref={toolbarRef}
                role="group"
                aria-label={isEditingText ? 'Text style' : 'Kudos tools'}
                className={POSTCARD_BAR}
              >
                <div
                  key={isEditingText ? 'text' : 'card'}
                  className="flex flex-wrap items-center justify-center gap-0.5 motion-safe:animate-enter"
                >
                  {isEditingText ? (
                    <KudosTextToolbar
                      textStyle={draft.textStyle}
                      inks={KUDOS_TEMPLATES[draft.templateKey].inks}
                      onTextStyleChange={handleTextStyleChange}
                      onDone={handleDone}
                    />
                  ) : (
                    <PostcardStickerPicker
                      count={draft.stickers.length}
                      description={STICKER_HINT}
                      onAddSticker={handleAddSticker}
                    />
                  )}
                </div>
              </div>
              {!isEditingText && (
                <div
                  className={cn(
                    POSTCARD_BAR,
                    'justify-center motion-safe:animate-enter',
                  )}
                >
                  <Button
                    variant="primary"
                    ref={sendRef}
                    loading={status === 'posting'}
                    disabled={hasGone || !isReady}
                    onClick={handleSend}
                    className="min-h-11"
                  >
                    Send kudos
                    <ArrowRightIcon aria-hidden="true" className="size-4.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <PostcardLeaveDialog
          {...leaveDialog}
          hasWritten={draft.message.trim() !== '' || draft.stickers.length > 0}
          lost="What you wrote will be lost."
        />
      </DialogContent>
    </PostcardDrawerContainer>
  );
}
