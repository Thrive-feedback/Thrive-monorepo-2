import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { KudosBoardPage } from '@/app/(signed-in)/(brand-new)/brand-new-kudos/_lib/kudos-board.type';
import type { ReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { KudosBoardPages } from './kudos-board-pages';
import { KudosBoardPlacesProvider } from './kudos-board-places';
import { KudosBoardTidy } from './kudos-board-tidy';

const readNextKudosBoardPage = vi.fn();
vi.mock(
  '@/app/(signed-in)/(brand-new)/brand-new-kudos/_lib/kudos-board-actions.service',
  () => ({
    readNextKudosBoardPage: (input: unknown) => readNextKudosBoardPage(input),
  }),
);

/** `givenAt` of every Kudos here, as the back of a card writes it. */
const GIVEN_ON = '31 October 2026';

const person = (name: string) => ({
  accountId: `account-${name}`,
  name,
  photoUrl: null,
  inactive: false,
});

const kudos = (id: string, overrides: Partial<ReadKudos> = {}): ReadKudos => ({
  id,
  giver: person('Mali Chaiyo'),
  recipients: [person('Ben Wong')],
  message: `Thank you ${id}`,
  messageTags: NO_TEXT_TAGS,
  givenAt: '2026-10-31T03:00:00.000Z',
  drawing: {
    templateKey: 'peach-pop',
    textStyle: { font: 'modern', sizeStep: 4, align: 'center', ink: 'ink' },
    stickers: [],
  },
  ...overrides,
});

const pageOf = (
  ids: readonly string[],
  nextCursor: string | null = null,
): KudosBoardPage => ({ items: ids.map((id) => kudos(id)), nextCursor });

/** `k1`, `k2`… up to `count`, as a read of the board. */
const ids = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => `k${from + index}`);

/** Stands for the window changing width. */
let windowChanged: () => void;

class WatchesTheWindow {
  constructor(callback: () => void) {
    windowChanged = callback;
  }
  observe() {}
  disconnect() {}
}

/** Lays the board out this many cards across, as its classes do in a browser. */
function standAcross(columns: number) {
  document.querySelector('style[data-columns]')?.remove();
  const style = document.createElement('style');
  style.dataset.columns = '';
  style.textContent = `ul { grid-template-columns: ${'1px '.repeat(columns)}; }`;
  document.head.append(style);
}

function draw(
  firstPage: KudosBoardPage,
  { count = 2, month }: { count?: number; month?: string } = {},
) {
  render(
    <KudosBoardPlacesProvider>
      <KudosBoardTidy />
      <KudosBoardPages month={month} firstPage={firstPage} count={count} />
    </KudosBoardPlacesProvider>,
  );
}

function tidyUp() {
  return screen.getByRole('button', { name: 'Tidy up' });
}

function moveButton(giver = 'Mali Chaiyo') {
  return screen.getByRole('button', { name: `Kudos from ${giver}` });
}

/** Each box a card is measured in, inside a board of this width. */
function measureBoard(boardWidth: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      return this.tagName === 'SECTION'
        ? DOMRect.fromRect({ x: 0, y: 0, width: boardWidth, height: 1000 })
        : DOMRect.fromRect({ x: 100, y: 100, width: 200, height: 300 });
    },
  );
}

beforeEach(() => {
  readNextKudosBoardPage.mockReset();
  vi.stubGlobal('ResizeObserver', WatchesTheWindow);
  // One across, so a page is two cards: the fewest that show paging at work.
  standAcross(1);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('a card on the board', () => {
  it('shows what the Giver wrote', () => {
    draw(pageOf(['k1']));

    expect(screen.getByText('Thank you k1')).toBeVisible();
  });

  it('shows the stickers it was sent with, where they were put', () => {
    draw({
      items: [
        kudos('k1', {
          drawing: {
            templateKey: 'peach-pop',
            textStyle: {
              font: 'modern',
              sizeStep: 4,
              align: 'left',
              ink: 'ink',
            },
            stickers: [
              {
                stickerKey: 'system/sticker-01-thumbs-up',
                x: 62.5,
                y: 40,
                scale: 1.25,
                rotation: -8,
                side: 'back',
              },
            ],
          },
        }),
      ],
      nextCursor: null,
    });

    const sticker = screen.getByRole('img', { name: /sticker$/ });
    expect(sticker).toHaveStyle({ left: '62.5%', top: '40%', rotate: '-8deg' });
  });

  it('shows the faces of who gave it to whom, over their first names', () => {
    draw(pageOf(['k1']));

    expect(screen.getByText('MC')).toBeInTheDocument();
    expect(screen.getByText('BW')).toBeInTheDocument();
    expect(screen.getByText('Mali')).toBeVisible();
    expect(screen.getByText('Ben')).toBeVisible();
  });

  it('shows two faces and counts the rest', () => {
    const everyone = ['Dao Prasert', 'Chai Srisuk', 'Ann Lee', 'Nok Wattana'];
    draw({
      items: [kudos('k1', { recipients: everyone.map(person) })],
      nextCursor: null,
    });

    expect(screen.getByText('Dao & Chai +2')).toBeVisible();
    expect(screen.getByText('DP')).toBeInTheDocument();
    expect(screen.getByText('CS')).toBeInTheDocument();
    expect(screen.queryByText('AL')).not.toBeInTheDocument();
  });

  it('is for everyone when it names nobody', () => {
    draw({ items: [kudos('k1', { recipients: [] })], nextCursor: null });

    expect(screen.getByText('Everyone')).toBeVisible();
  });

  it('opens large on a press, with who gave it to whom under it', async () => {
    const user = userEvent.setup();
    draw(pageOf(['k1']));

    await user.click(moveButton());

    const dialog = await screen.findByRole('dialog', {
      name: 'Kudos from Mali Chaiyo',
    });
    expect(within(dialog).getByText('Thank you k1')).toBeVisible();
    expect(within(dialog).getByText('Mali Chaiyo')).toBeVisible();
    expect(within(dialog).getByText('Ben Wong')).toBeVisible();
  });

  it('opens large from the keyboard, at once', async () => {
    const user = userEvent.setup();
    draw(pageOf(['k1']));

    moveButton().focus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('dialog')).toBeVisible();
  });
});

describe('how many cards a page shows', () => {
  it('shows two rows of however many stand across', () => {
    standAcross(2);
    draw(pageOf(ids(1, 12)), { count: 12 });

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText('Page 1 of 3')).toBeVisible();
  });

  it('turns through what one read holds without reading again', async () => {
    const user = userEvent.setup();
    standAcross(2);
    draw(pageOf(ids(1, 12), 'c1'), { count: 24 });

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(await screen.findByText('Page 2 of 6')).toBeVisible();
    expect(screen.getByText('Thank you k5')).toBeVisible();
    expect(readNextKudosBoardPage).not.toHaveBeenCalled();
  });

  it('reads the next batch for a page that runs past the one it has', async () => {
    const user = userEvent.setup();
    standAcross(4);
    readNextKudosBoardPage.mockResolvedValue(pageOf(ids(13, 24)));
    draw(pageOf(ids(1, 12), 'c1'), { count: 24 });

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(await screen.findByText('Page 2 of 3')).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(8);
    expect(screen.getByText('Thank you k16')).toBeVisible();
  });

  it('stays on the same cards when the window changes width', async () => {
    const user = userEvent.setup();
    standAcross(2);
    draw(pageOf(ids(1, 12)), { count: 12 });
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await screen.findByText('Page 3 of 3');

    standAcross(1);
    act(() => windowChanged());

    expect(await screen.findByText('Page 5 of 6')).toBeVisible();
    expect(screen.getByText('Thank you k9')).toBeVisible();
  });
});

describe('turning the pages of the board', () => {
  it('says where you are and goes on to the next page', async () => {
    const user = userEvent.setup();
    readNextKudosBoardPage
      .mockResolvedValueOnce(pageOf(['k3', 'k4'], 'c2'))
      .mockResolvedValueOnce(pageOf(['k5', 'k6']));
    draw(pageOf(['k1', 'k2'], 'c1'), { count: 6, month: '2026-10' });

    expect(screen.getByText('Page 1 of 3')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(await screen.findByText('Page 2 of 3')).toBeVisible();
    expect(screen.getByText('Thank you k3')).toBeVisible();
    expect(readNextKudosBoardPage).toHaveBeenCalledWith({
      month: '2026-10',
      cursor: 'c1',
    });
  });

  it('reads a page once, however many ways someone heads for it', async () => {
    const user = userEvent.setup();
    readNextKudosBoardPage.mockResolvedValue(pageOf(['k3', 'k4']));
    draw(pageOf(['k1', 'k2'], 'c1'), { count: 4 });
    const next = screen.getByRole('button', { name: 'Next page' });

    await user.hover(next);
    await user.click(next);

    await screen.findByText('Page 2 of 2');
    expect(readNextKudosBoardPage).toHaveBeenCalledTimes(1);
  });

  it('reads the page after the one it arrives at, so the next turn does not wait', async () => {
    const user = userEvent.setup();
    readNextKudosBoardPage
      .mockResolvedValueOnce(pageOf(['k3', 'k4'], 'c2'))
      .mockResolvedValueOnce(pageOf(['k5', 'k6']));
    draw(pageOf(['k1', 'k2'], 'c1'), { count: 6 });

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    await waitFor(() =>
      expect(readNextKudosBoardPage).toHaveBeenLastCalledWith({
        cursor: 'c2',
        month: undefined,
      }),
    );
  });

  it('goes back without reading anything', async () => {
    const user = userEvent.setup();
    readNextKudosBoardPage.mockResolvedValue(pageOf(['k3', 'k4']));
    draw(pageOf(['k1', 'k2'], 'c1'), { count: 4 });

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await screen.findByText('Page 2 of 2');
    readNextKudosBoardPage.mockClear();
    await user.click(screen.getByRole('button', { name: 'Previous page' }));

    expect(await screen.findByText('Page 1 of 2')).toBeVisible();
    expect(readNextKudosBoardPage).not.toHaveBeenCalled();
  });

  it('stops at both ends, with the focus on the arrow still in use', async () => {
    const user = userEvent.setup();
    readNextKudosBoardPage.mockResolvedValue(pageOf(['k3', 'k4']));
    draw(pageOf(['k1', 'k2'], 'c1'), { count: 4 });

    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await screen.findByText('Page 2 of 2');

    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toHaveFocus();
  });

  it('trusts the end of the list over a count that has fallen behind', async () => {
    const user = userEvent.setup();
    readNextKudosBoardPage.mockResolvedValue(pageOf(['k3', 'k4']));
    draw(pageOf(['k1', 'k2'], 'c1'), { count: 10 });

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(await screen.findByText('Page 2 of 2')).toBeVisible();
  });

  it('says so when a page cannot be read, keeps the one showing, and tries again', async () => {
    const user = userEvent.setup();
    readNextKudosBoardPage.mockResolvedValueOnce(null);
    draw(pageOf(['k1', 'k2'], 'c1'), { count: 4 });

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't read the next page.",
    );
    expect(screen.getByText('Page 1 of 2')).toBeVisible();
    expect(screen.getByText('Thank you k1')).toBeVisible();

    readNextKudosBoardPage.mockResolvedValueOnce(pageOf(['k3', 'k4']));
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Page 2 of 2')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows no bar when everything fits on one page', () => {
    draw(pageOf(['k1']));

    expect(
      screen.queryByRole('navigation', { name: 'Pages of the board' }),
    ).not.toBeInTheDocument();
  });

  it('turns the page with a finger, and leaves a short swipe where it was', async () => {
    const user = userEvent.setup();
    readNextKudosBoardPage.mockResolvedValue(pageOf(['k3', 'k4']));
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(400);
    draw(pageOf(['k1', 'k2'], 'c1'), { count: 4 });
    const board = screen.getByRole('region', { name: 'All Kudos' });
    const swipe = (to: number) =>
      user.pointer([
        { keys: '[TouchA>]', target: board, coords: { x: 300, y: 100 } },
        { pointerName: 'TouchA', target: board, coords: { x: to, y: 100 } },
        { keys: '[/TouchA]', target: board },
      ]);

    await swipe(280);
    await waitFor(() => expect(readNextKudosBoardPage).toHaveBeenCalled());
    expect(screen.getByText('Page 1 of 2')).toBeVisible();

    await swipe(100);
    expect(await screen.findByText('Page 2 of 2')).toBeVisible();
  });
});

/** Longer than a press waits for a second one. */
const WELL_PAST_A_PRESS = 450;

/** Lets a card finish turning, which a browser does through its two animations. */
function finishTurning() {
  const card = screen.getByText(GIVEN_ON).closest('.grid');
  if (card) {
    fireEvent.animationEnd(card);
    fireEvent.animationEnd(card);
  }
}

function theBack() {
  return screen.queryByRole('img', { name: 'Thrive' });
}

describe('turning a card over', () => {
  it('turns over on a double click, to the day it was given', async () => {
    const user = userEvent.setup();
    draw(pageOf(['k1']));

    await user.dblClick(moveButton());
    finishTurning();

    expect(theBack()).toBeVisible();
    expect(screen.getByText(GIVEN_ON)).toBeVisible();
  });

  it('turns back on another double click', async () => {
    const user = userEvent.setup();
    draw(pageOf(['k1']));

    await user.dblClick(moveButton());
    finishTurning();
    await user.dblClick(moveButton());
    finishTurning();

    expect(theBack()).not.toBeInTheDocument();
  });

  it('opens nothing when it is turned over', async () => {
    const user = userEvent.setup();
    draw(pageOf(['k1']));

    await user.dblClick(moveButton());
    await new Promise((resolve) => setTimeout(resolve, WELL_PAST_A_PRESS));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('turns over on a double tap', async () => {
    const user = userEvent.setup();
    draw(pageOf(['k1']));
    const grip = moveButton();

    await user.pointer([
      { keys: '[TouchA]', target: grip },
      { keys: '[TouchA]', target: grip },
    ]);
    finishTurning();

    expect(theBack()).toBeVisible();
  });

  it('neither opens nor turns over when a drag ends', async () => {
    const user = userEvent.setup();
    measureBoard(1000);
    draw(pageOf(['k1']));
    const grip = moveButton();

    await user.pointer([
      { keys: '[MouseLeft>]', target: grip, coords: { x: 150, y: 150 } },
      { target: grip, coords: { x: 210, y: 190 } },
      { keys: '[/MouseLeft]', target: grip },
    ]);
    await new Promise((resolve) => setTimeout(resolve, WELL_PAST_A_PRESS));
    finishTurning();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(theBack()).not.toBeInTheDocument();
  });

  it('is put right by Tidy up, which waits for something to tidy', async () => {
    const user = userEvent.setup();
    draw(pageOf(['k1']));

    await user.dblClick(moveButton());
    finishTurning();
    expect(tidyUp()).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Tidy up' }));
    finishTurning();

    expect(theBack()).not.toBeInTheDocument();
    expect(tidyUp()).toBeDisabled();
  });
});

describe('moving cards and tidying up', () => {
  it('has nothing to tidy until a card is moved', () => {
    draw(pageOf(['k1']));

    expect(tidyUp()).toBeDisabled();
  });

  it('moves a card with the arrow keys, and Tidy up puts it back', async () => {
    const user = userEvent.setup();
    measureBoard(1000);
    draw(pageOf(['k1']));
    const card = screen.getByRole('listitem');

    moveButton().focus();
    await user.keyboard('{ArrowRight}{ArrowDown}');

    expect(card).toHaveStyle({ translate: '24px 24px' });
    expect(tidyUp()).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Tidy up' }));

    expect(card.style.translate).toBe('');
    expect(screen.getByRole('status')).toHaveTextContent('Board tidied.');
    expect(tidyUp()).toBeDisabled();
  });

  it('keeps a card on the board', async () => {
    const user = userEvent.setup();
    measureBoard(310);
    draw(pageOf(['k1']));

    moveButton().focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('listitem')).toHaveStyle({ translate: '10px 0px' });
  });

  it('drags a card with the mouse, and leaves it there', async () => {
    const user = userEvent.setup();
    measureBoard(1000);
    draw(pageOf(['k1']));
    const grip = moveButton();

    await user.pointer([
      { keys: '[MouseLeft>]', target: grip, coords: { x: 150, y: 150 } },
      { target: grip, coords: { x: 210, y: 190 } },
      { keys: '[/MouseLeft]', target: grip },
    ]);

    expect(screen.getByRole('listitem')).toHaveStyle({
      translate: '60px 40px',
    });
    expect(tidyUp()).toBeEnabled();
  });

  it('puts no delay on a card itself, which would leave it behind the pointer', () => {
    draw(pageOf(['k1', 'k2']));

    for (const card of screen.getAllByRole('listitem')) {
      expect(card.style.transitionDelay).toBe('');
    }
  });

  it('leaves a card where it hangs when a finger presses it', async () => {
    const user = userEvent.setup();
    draw(pageOf(['k1']));
    const grip = moveButton();

    await user.pointer([
      { keys: '[TouchA>]', target: grip, coords: { x: 150, y: 150 } },
      { pointerName: 'TouchA', target: grip, coords: { x: 150, y: 210 } },
      { keys: '[/TouchA]', target: grip },
    ]);

    expect(tidyUp()).toBeDisabled();
  });
});
