import { ArrowRightIcon } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Button } from '@/components/atoms/button';
import { DialogContent } from '@/components/atoms/dialog';
import { AutocompleteTextarea } from '@/components/molecules/autocomplete-textarea';
import {
  FEED_CARD_GROUND,
  FEED_CARD_KIND_INK,
} from '@/components/organisms/feed-card/feed-card-tone.constant';
import { FeedbackStyleSwitch } from '@/components/organisms/feedback-style-switch';
import { FeedbackText } from '@/components/organisms/feedback-text';
import { calendarDay } from '@/lib/calendar-day.util';
import { cn } from '@/lib/cn.util';
import {
  cutFieldToMessageLength,
  MAX_MESSAGE_LENGTH,
  messageLength,
} from '@/lib/feedback/message-length.util';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import styles from './postcard.module.css';
import { PostcardAddress } from './postcard-address';
import { PostcardFrom } from './postcard-address-read-only';
import type {
  PostcardCard,
  PostcardWriter,
  StyleSwitching,
} from './postcard-draft.type';
import { isReady, sendNote } from './postcard-draft.util';
import {
  COPY,
  POSTCARD_BAR,
  POSTCARD_CARD_COLUMN,
  POSTCARD_PAGE,
  POSTCARD_SCREEN,
  RECIPIENTS,
} from './postcard-editor.constant';
import { PostcardLeaveDialog, usePostcardLeave } from './postcard-leave-dialog';
import { PostcardTitleRow } from './postcard-title-row';
import { PostcardVisibilityTool } from './postcard-visibility-tool';
import { useFeedbackDraft } from './use-feedback-draft';
import { PostcardDrawerContainer } from './use-postcard-drawer-container';
import { usePostcardOpener } from './use-postcard-opener';
import { useStyleSwitch } from './use-style-switch';

type SendStatus = 'writing' | 'posting';

export type PlainFeedbackEditorProps = {
  title: string;
  writer: PostcardWriter;
  card: PostcardCard;
  /** What this opening shares with the postcard it switches with. */
  switching: StyleSwitching;
  /** Whether Close and Escape ask before leaving; `PostcardDialog` says. */
  asksBeforeClosing?: boolean;
  /** The writer chose to leave, or the Feedback has been sent: the dialog should close. */
  onClose: () => void;
  onCloseAutoFocus?: (event: Event) => void;
};

/**
 * The writing dialog in the plain style: the same Feedback as on a postcard — who it is for, the
 * message, who else can read it — typed on a sheet of paper, with no picture, stamp or stickers to
 * choose. It sends what a new postcard would carry, its picture chosen at random, so whoever reads
 * it, always on a postcard, gets a whole card.
 *
 * - `give` and `ask`: From and To over the message, then who can read it and Send.
 * - `answer`: the Request message over the answer.
 */
export function PlainFeedbackEditor({
  title,
  writer,
  card,
  switching,
  asksBeforeClosing = true,
  onClose,
  onCloseAutoFocus,
}: PlainFeedbackEditorProps) {
  const {
    draft,
    audience,
    triggers,
    selectedReaders,
    visibilityToolProps,
    handleRecipientsChange,
    changeMessage,
    handOver,
    writtenSoFar,
    hasWrittenWords,
  } = useFeedbackDraft(card, switching.openingRecipientAccountIds);
  const { kind, teammates } = card;
  const copy = COPY[kind];
  const [status, setStatus] = useState<SendStatus>('writing');
  const contentRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const messageId = useId();
  const limitId = useId();
  // The day it is written, at the head of the letter as a letter dates itself.
  const [today] = useState(() => new Date().toISOString());
  const styleSwitch = useStyleSwitch({
    switching,
    contentRef,
    pageRef,
    writtenSoFar,
  });
  const { noteOpener, handleCloseAutoFocus } = usePostcardOpener(
    onCloseAutoFocus,
    styleSwitch.opener,
  );

  const { askToClose, leaveDialog } = usePostcardLeave({
    isWriting: status === 'writing',
    fallbackRef: messageRef,
    onLeave: onClose,
    asksBeforeClosing,
  });

  function handleMessageChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    changeMessage(cutFieldToMessageLength(event.currentTarget));
  }

  async function handleSend() {
    setStatus('posting');
    if (await handOver()) {
      onClose();
      return;
    }
    setStatus('writing');
  }

  // The cursor belongs on "To" while nobody is chosen, on the message once somebody is. Whatever
  // had it before is the opener, which gets it back on close.
  function handleOpenAutoFocus(event: Event) {
    if (styleSwitch.arriveSwitchedIn(event)) {
      return;
    }
    noteOpener();
    const target =
      kind !== 'answer' && draft.recipientAccountIds.length === 0
        ? addressRef.current?.querySelector('button')
        : messageRef.current;
    if (target instanceof HTMLElement) {
      event.preventDefault();
      target.focus();
    }
  }

  function handleEscapeKeyDown(event: KeyboardEvent) {
    event.preventDefault();
    askToClose();
  }

  const isPosting = status === 'posting';

  return (
    // Its drawers are rendered inside it, as the postcard's are (ADR 0066). It stands in the
    // postcard's own frame, the title row where the card's is, so switching style changes only
    // what lies under the title.
    <PostcardDrawerContainer value={contentRef}>
      <DialogContent
        placement="screen"
        ref={contentRef}
        hasCloseButton={false}
        aria-describedby={undefined}
        onOpenAutoFocus={handleOpenAutoFocus}
        onCloseAutoFocus={handleCloseAutoFocus}
        onEscapeKeyDown={handleEscapeKeyDown}
        onInteractOutside={(event) => event.preventDefault()}
        overlayClassName={cn(styles.scrim, styleSwitch.switchedInClassName)}
        className={cn(POSTCARD_SCREEN, styleSwitch.switchedInClassName)}
      >
        <div
          ref={pageRef}
          inert={isPosting}
          className={POSTCARD_PAGE}
          style={styleSwitch.pageStyle}
        >
          <PostcardTitleRow title={title} onClose={askToClose}>
            <FeedbackStyleSwitch {...styleSwitch.switchProps} />
          </PostcardTitleRow>

          <div className={POSTCARD_CARD_COLUMN}>
            {/* The room the card's own buttons take above it on a narrow screen, so the sheet starts
            where the card does. */}
            <div aria-hidden="true" className="h-9 lg:hidden" />
            {/* A typed letter on white paper, the card's size exactly: as tall as it below `md`, its
            shape from `md`. The paper is the field, as on the postcard; while it is written in, its
            edge takes the product's plum. */}
            <div className="flex min-h-96 flex-col rounded-element border border-border-muted bg-surface-base shadow-high transition-colors duration-fast has-[textarea:focus]:border-action-primary md:aspect-3/2 md:min-h-0">
              <div className="flex flex-col gap-4 border-border-subtle border-b px-6 pt-6 pb-5 md:px-10 md:pt-8">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                  {card.kind === 'answer' ? (
                    <PostcardFrom writer={writer} />
                  ) : (
                    <div ref={addressRef} className="min-w-0">
                      <PostcardAddress
                        writer={writer}
                        teammates={teammates}
                        recipientAccountIds={draft.recipientAccountIds}
                        recipientsLabel={RECIPIENTS[card.kind].label}
                        recipientsDescription={
                          RECIPIENTS[card.kind].description
                        }
                        onRecipientsChange={handleRecipientsChange}
                      />
                    </div>
                  )}
                  <time
                    dateTime={today}
                    className="pt-2 text-body-3 text-fg-secondary tabular-nums"
                  >
                    {calendarDay(today)}
                  </time>
                </div>
                {card.kind === 'answer' && (
                  // What is answered, in the blue of everything asked, as its card is in a list.
                  <section
                    aria-label="Their request"
                    className={cn(
                      'flex flex-col gap-2 rounded-control px-4 py-3',
                      FEED_CARD_GROUND.tertiary,
                    )}
                  >
                    <p
                      className={cn('text-label', FEED_CARD_KIND_INK.tertiary)}
                    >
                      {card.ask.requester.name} asked
                    </p>
                    <p className="whitespace-pre-wrap break-words text-body-2">
                      <FeedbackText
                        text={card.ask.message}
                        tags={card.ask.messageTags ?? NO_TEXT_TAGS}
                      />
                    </p>
                  </section>
                )}
              </div>

              <div className="flex min-h-0 flex-1 flex-col px-6 pt-5 pb-4 md:px-10">
                <label htmlFor={messageId} className="sr-only">
                  {copy.messageLabel}
                </label>
                <AutocompleteTextarea
                  ref={messageRef}
                  id={messageId}
                  value={draft.message}
                  triggers={triggers}
                  aria-describedby={limitId}
                  placeholder={copy.placeholder}
                  onChange={handleMessageChange}
                  fill
                  className="field-sizing-fixed min-h-32 resize-none rounded-none border-0 bg-transparent px-0 py-0 text-body-1 focus-visible:outline-hidden"
                />
                <p
                  id={limitId}
                  className="pt-3 text-right text-body-3 text-fg-secondary tabular-nums"
                >
                  <span className="sr-only">Up to </span>
                  <span aria-hidden="true">
                    {messageLength(draft.message)}/
                  </span>
                  {MAX_MESSAGE_LENGTH.toLocaleString('en-GB')}
                  <span className="sr-only"> characters.</span>
                </p>
              </div>
            </div>
          </div>

          <p
            aria-live="polite"
            className="max-w-2xl text-center text-body-3 text-fg-secondary"
          >
            {sendNote(kind, draft, audience.visibility, selectedReaders)}
          </p>

          {/* The postcard's own row under the card, its box of who can read it and Send where the
          postcard keeps them, so the two stay put across a switch. */}
          <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:items-stretch sm:justify-center">
            <div
              className={cn(POSTCARD_BAR, 'flex-wrap justify-center gap-1.5')}
            >
              {visibilityToolProps && (
                <PostcardVisibilityTool {...visibilityToolProps} />
              )}
              <Button
                variant="primary"
                loading={isPosting}
                disabled={
                  !isReady(kind, draft, audience.visibility, selectedReaders)
                }
                onClick={() => void handleSend()}
                className="min-h-11"
              >
                {copy.send}
                <ArrowRightIcon aria-hidden="true" className="size-4.5" />
              </Button>
            </div>
          </div>
        </div>

        <PostcardLeaveDialog
          {...leaveDialog}
          hasWritten={hasWrittenWords}
          lost={copy.lost}
        />
      </DialogContent>
    </PostcardDrawerContainer>
  );
}
