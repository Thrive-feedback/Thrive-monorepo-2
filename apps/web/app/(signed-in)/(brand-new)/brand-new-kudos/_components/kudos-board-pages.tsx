'use client';

import { useCallback, useId, useRef, useState } from 'react';
import {
  KUDOS_BOARD_GRID,
  KUDOS_BOARD_READ_SIZE,
  KUDOS_BOARD_ROWS,
} from '@/app/(signed-in)/(brand-new)/brand-new-kudos/_lib/kudos-board.constant';
import type { KudosBoardPage } from '@/app/(signed-in)/(brand-new)/brand-new-kudos/_lib/kudos-board.type';
import { readNextKudosBoardPage } from '@/app/(signed-in)/(brand-new)/brand-new-kudos/_lib/kudos-board-actions.service';
import { kudosMonthName } from '@/app/(signed-in)/(brand-new)/brand-new-kudos/_lib/kudos-board-place.util';
import { HandwrittenNote } from '@/components/molecules/handwritten-note';
import { KudosCardReadDialog } from '@/components/organisms/kudos-dialog/kudos-card-read-dialog';
import type { ReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.type';
import { cn } from '@/lib/cn.util';
import styles from './kudos-board.module.css';
import { KudosBoardCard } from './kudos-board-card';
import { KudosBoardPager } from './kudos-board-pager';
import { useKudosBoardPlaces } from './kudos-board-places';
import { useKudosBoardColumns } from './use-kudos-board-columns';
import { useKudosBoardPages } from './use-kudos-board-pages';
import { useKudosBoardSwipe } from './use-kudos-board-swipe';

/** How many pages stand ready either side of the one showing, so one always has somewhere to go. */
const NEARBY = 1;

export type KudosBoardPagesProps = {
  /** The month showing, or nothing for every month. */
  month: string | undefined;
  firstPage: KudosBoardPage;
  /** How many Kudos the Workspace's count says there are. */
  count: number;
};

/**
 * The board and the bar under it. Two rows of cards fill the window, as many across as its width
 * allows, and the pages stand on a strip of which only the one showing can be reached. The pages
 * beside it stay drawn, so a turn has somewhere to go from and to, and those further off are empty,
 * so a long read does not keep every card on the page. Until the page has been measured it holds a
 * whole read and the grid shows what fits, so the first paint needs no script.
 */
export function KudosBoardPages({
  month,
  firstPage,
  count,
}: KudosBoardPagesProps) {
  const boardRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const hintId = useId();
  const [reading, setReading] = useState<ReadKudos | null>(null);
  const [isReadingOpen, setIsReadingOpen] = useState(false);
  const { places, turned, moveCard, turnCard } = useKudosBoardPlaces();
  const columns = useKudosBoardColumns(gridRef);

  const openCard = useCallback((kudos: ReadKudos) => {
    setReading(kudos);
    setIsReadingOpen(true);
  }, []);

  const readNext = useCallback(
    (cursor: string) => readNextKudosBoardPage({ month, cursor }),
    [month],
  );

  const { pages, index, phase, pageTotal, canGoBack, canGoOn, ...turn } =
    useKudosBoardPages({
      firstPage,
      count,
      perPage: columns ? columns * KUDOS_BOARD_ROWS : KUDOS_BOARD_READ_SIZE,
      readNext,
    });
  const swipe = useKudosBoardSwipe({
    trackRef,
    canGoBack,
    canGoOn,
    onStart: turn.readAhead,
    onGoBack: turn.goBack,
    onGoOn: turn.goOn,
  });

  return (
    <>
      <section
        ref={boardRef}
        aria-label={month ? `Kudos of ${kudosMonthName(month)}` : 'All Kudos'}
        {...swipe}
        className={cn('touch-pan-y', styles.board)}
      >
        <span id={hintId} className="sr-only">
          Press it to read it large, and double-click it to turn it over. The
          arrow keys move it around the board, and with Shift they move it
          further.
        </span>
        <div
          ref={trackRef}
          style={{ '--kudos-board-page': index } as React.CSSProperties}
          className={styles.track}
        >
          {pages.map((items, position) => {
            const isShowing = position === index;
            return (
              <ul
                // Pages are cut from one list, so a place on the strip is all that names one.
                // biome-ignore lint/suspicious/noArrayIndexKey: see above
                key={position}
                ref={position === 0 ? gridRef : undefined}
                aria-hidden={!isShowing}
                inert={!isShowing}
                className={cn(KUDOS_BOARD_GRID, styles.page)}
              >
                {Math.abs(position - index) <= NEARBY &&
                  items.map((item, place) => (
                    <KudosBoardCard
                      key={item.id}
                      item={item}
                      place={places.get(item.id)}
                      position={place}
                      isTurned={turned.has(item.id)}
                      boardRef={boardRef}
                      hintId={hintId}
                      onMove={moveCard}
                      onOpen={openCard}
                      onTurn={turnCard}
                    />
                  ))}
              </ul>
            );
          })}
        </div>
      </section>
      {/* Held open before there is a bar, so measuring the board moves nothing. The notes teach what
          nothing on a card shows, and only where a mouse can do it and there is room for them. */}
      <div className="flex min-h-11 items-center justify-center lg:grid lg:grid-cols-3">
        <HandwrittenNote
          size="md"
          tilt="left"
          writes="on-open"
          className="hidden pointer-fine:lg:block"
        >
          double-click to flip one
        </HandwrittenNote>
        <div className="flex justify-center lg:col-start-2">
          {columns !== null && pageTotal > 1 && (
            <KudosBoardPager
              page={index + 1}
              pageTotal={pageTotal}
              canGoBack={canGoBack}
              canGoOn={canGoOn}
              isReading={phase === 'reading'}
              hasFailed={phase === 'failed'}
              onApproach={turn.readAhead}
              onGoBack={turn.goBack}
              onGoOn={turn.goOn}
            />
          )}
        </div>
        <HandwrittenNote
          size="md"
          writes="on-open"
          className="hidden justify-self-end pointer-fine:lg:block"
        >
          go on, drag them around
        </HandwrittenNote>
      </div>
      {reading && (
        <KudosCardReadDialog
          kudos={reading}
          open={isReadingOpen}
          onOpenChange={setIsReadingOpen}
        />
      )}
    </>
  );
}
