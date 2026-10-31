import { ArrowRightIcon } from 'lucide-react';
import { memo, useCallback, useMemo, useReducer, useRef } from 'react';
import { Button } from '@/components/atoms/button';
import { DialogContent } from '@/components/atoms/dialog';
import { feedbackTagTriggers } from '@/components/organisms/feedback-tag-triggers.util';
import postcardStyles from '@/components/organisms/postcard-dialog/postcard.module.css';
import {
  POSTCARD_BAR,
  POSTCARD_PAGE,
  POSTCARD_SCREEN,
  SENT_AWAY,
} from '@/components/organisms/postcard-dialog/postcard-editor.constant';
import { PostcardHideButton } from '@/components/organisms/postcard-dialog/postcard-hide-button';
import {
  PostcardLeaveDialog,
  usePostcardLeave,
} from '@/components/organisms/postcard-dialog/postcard-leave-dialog';
import { PostcardSticker } from '@/components/organisms/postcard-dialog/postcard-sticker';
import { PostcardStickerPicker } from '@/components/organisms/postcard-dialog/postcard-sticker-picker';
import { CardTextToolbar } from '@/components/organisms/postcard-dialog/postcard-text-toolbar';
import { PostcardTitleRow } from '@/components/organisms/postcard-dialog/postcard-title-row';
import { useCardStickers } from '@/components/organisms/postcard-dialog/use-card-stickers';
import { useCardTextTools } from '@/components/organisms/postcard-dialog/use-card-text-tools';
import { PostcardDrawerContainer } from '@/components/organisms/postcard-dialog/use-postcard-drawer-container';
import { usePostcardOpener } from '@/components/organisms/postcard-dialog/use-postcard-opener';
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

const TITLE = 'Give kudos';

const WHO_READS = 'Everyone in your Workspace reads a Kudos.';
const FOR_EVERYONE =
  'For everyone in your Workspace. Name a teammate with @ to thank them by name.';
const STICKER_HINT =
  'Up to three on your card. Drag a sticker where you like, or hide them to read what is under them.';

export type KudosEditorProps = {
  teammates: readonly Teammate[];
  workspaceGoals: readonly string[];
  /** What is already written as it opens. Read once: the card owns it from then on. */
  defaultMessage: string;
  onSend: (kudos: KudosDraft) => Promise<boolean>;
  /** The writer chose to leave: the dialog should close. */
  onClose: () => void;
  onGoToBoard: () => void;
  onBackToHome: () => void;
  onCloseAutoFocus?: (event: Event) => void;
};

/**
 * One opening of `KudosDialog`: everything written on the card. Mounted afresh for each opening, so
 * nothing carries from one card to the next. It has no address and no Visibility: who it is for is
 * whoever the words mention, or the whole Workspace if they mention nobody, and every Member reads
 * it.
 */
export function KudosEditor({
  teammates,
  workspaceGoals,
  defaultMessage,
  onSend,
  onClose,
  onGoToBoard,
  onBackToHome,
  onCloseAutoFocus,
}: KudosEditorProps) {
  const [draft, change] = useReducer(
    applyKudosChange,
    defaultMessage,
    blankKudosDraft,
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<HTMLButtonElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const backToHomeRef = useRef<HTMLButtonElement>(null);
  const { noteOpener, handleCloseAutoFocus } =
    usePostcardOpener(onCloseAutoFocus);
  const {
    isEditingText,
    setIsEditingText,
    handleDone,
    handleFocus,
    handleToolbarMouseDown,
    handleEscape,
  } = useCardTextTools({ messageRef, contentRef, toolbarRef });
  const placeSticker = useCallback(
    (id: string, stickerKey: string) =>
      change({ kind: 'addSticker', id, stickerKey }),
    [],
  );
  const {
    selectedId,
    setSelectedId,
    letGo,
    areStickersHidden,
    handleAddSticker,
    handleChangeSticker,
    handleRemoveSticker,
    handleHideStickers,
    showStickers,
  } = useCardStickers({
    change,
    place: placeSticker,
    toolbarRef,
    keepsSelection: '[data-sticker], [data-sticker-panel]',
  });

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
      letGo();
      onClose();
    },
  });

  const triggers = useMemo(
    () => feedbackTagTriggers(workspaceGoals, teammates),
    [workspaceGoals, teammates],
  );
  const recipients = mentionedTeammates(draft.message, teammates);
  const isReady = draft.message.trim() !== '';

  function handleMessageChange(message: string) {
    change({ kind: 'message', message });
  }
  const handleMessageFocus = useCallback(
    () => setIsEditingText(true),
    [setIsEditingText],
  );
  const handleTemplateChange = useCallback(
    (templateKey: KudosTemplateKey) =>
      change({ kind: 'template', templateKey }),
    [],
  );
  const handleTextStyleChange = useCallback(
    (fields: Partial<KudosTextStyle>) => change({ kind: 'style', fields }),
    [],
  );

  function handleSend() {
    showStickers();
    void send();
  }

  // Once the card is on the board there is nothing to lose, so Escape goes back to Home.
  function handleEscapeKeyDown(event: KeyboardEvent) {
    event.preventDefault();
    if (status === 'pinned') {
      onBackToHome();
    } else {
      handleEscape(askToClose);
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
        overlayClassName={postcardStyles.scrim}
        className={POSTCARD_SCREEN}
      >
        {pin.isOnBoard && (
          <KudosPinBoard ref={pin.boardRef} isSettled={status === 'pinned'} />
        )}
        {status === 'pinned' && (
          <KudosPinActions
            ref={backToHomeRef}
            onGoToBoard={onGoToBoard}
            onBackToHome={onBackToHome}
          />
        )}
        {/* A card that has been sent is inert from then on, so nothing edits what has gone. */}
        <div inert={status !== 'writing'} className={POSTCARD_PAGE}>
          <PostcardTitleRow
            title={TITLE}
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
