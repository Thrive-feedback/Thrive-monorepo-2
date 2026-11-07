import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  HomeFeedAsk,
  HomeFeedItem,
  HomeFeedPerson,
  HomeFeedRequest,
} from '@/lib/feedback/home-feed-item.type';
import { NO_TEXT_TAGS, type TextTags } from '@/lib/feedback/text-tags.type';
import { PAST_THE_DRAWING } from '@/lib/test/past-the-drawing';
import type { GivenPostcard } from '../postcard-dialog/postcard-read.type';
import { DEFAULT_TEXT_STYLE } from '../postcard-dialog/postcard-style.constant';
import { FeedCard } from './feed-card';

const person = (accountId: string, name: string, inactive = false) => ({
  accountId,
  name,
  photoUrl: null,
  inactive,
});

const ANN = person('ann', 'Ann Lee');
const BEN = person('ben', 'Ben Carter');
const CARA = person('cara', 'Cara Diaz');

const A_CARD: GivenPostcard = {
  kind: 'give',
  giver: CARA,
  receivers: [BEN],
  templateKey: 'system/postcard_template_1',
  tone: 'cream',
  textStyle: DEFAULT_TEXT_STYLE,
  stickers: [],
  stampKey: null,
  message: 'The second paragraph does the work now.',
  messageTags: NO_TEXT_TAGS,
  sentOn: '2026-10-31T03:00:00.000Z',
};

const OFFERED: HomeFeedItem = {
  id: 'fb-1',
  origin: 'OFFERED',
  giver: CARA,
  receivers: [BEN],
  message: 'The second paragraph does the work now.',
  messageTags: NO_TEXT_TAGS,
  givenAt: '2026-10-31T03:00:00.000Z',
  visibility: 'EVERYONE',
  request: null,
  card: A_CARD,
};

const DAO = person('dao', 'Dao Prasert');
const NOK = person('nok', 'Nok Wattana');

const answered = (
  who: HomeFeedPerson,
  message: string,
  messageTags: TextTags = NO_TEXT_TAGS,
): HomeFeedAsk => ({
  person: who,
  status: 'ANSWERED',
  answer: { message, messageTags },
});

const waiting = (who: HomeFeedPerson): HomeFeedAsk => ({
  person: who,
  status: 'PENDING',
  answer: null,
});

const QUESTION: HomeFeedRequest = {
  message: 'How clear was the plan?',
  messageTags: NO_TEXT_TAGS,
  requester: BEN,
  asked: [
    answered(CARA, 'The order of the steps was clear.'),
    answered(DAO, 'I would add who to call.'),
    waiting(NOK),
  ],
};

const REQUESTED: HomeFeedItem = {
  ...OFFERED,
  id: 'fb-2',
  origin: 'REQUESTED',
  message: 'The order of the steps was clear.',
  request: QUESTION,
};

function renderCard(item: HomeFeedItem, readerAccountId = ANN.accountId) {
  render(
    <FeedCard
      item={item}
      readerAccountId={readerAccountId}
      target={{ href: `/home?feedback=${item.id}` }}
    />,
  );
}

describe('FeedCard', () => {
  it('draws Offered Feedback as how it came about and the message', () => {
    renderCard(OFFERED);

    const card = screen.getByRole('article');
    expect(
      within(card).getByText('Offered', PAST_THE_DRAWING),
    ).toBeInTheDocument();
    expect(
      within(card).getByText(OFFERED.message, PAST_THE_DRAWING),
    ).toBeInTheDocument();
  });

  it('shows who it is for with their name beside their face', () => {
    renderCard(OFFERED);

    expect(
      screen.getByText('Ben Carter', PAST_THE_DRAWING),
    ).toBeInTheDocument();
    expect(screen.getByText('BC', PAST_THE_DRAWING)).toBeInTheDocument();
  });

  it('points at the small postcard, by hand, saying what is in it', () => {
    renderCard(OFFERED);

    expect(
      screen.getByText('Read the whole postcard', PAST_THE_DRAWING),
    ).toBeInTheDocument();
  });

  it('points a request at the answers in its postcard', () => {
    renderCard(REQUESTED);

    expect(
      screen.getByText('All the answers in here', PAST_THE_DRAWING),
    ).toBeInTheDocument();
  });

  it('keeps that note out of the link and away from a screen reader', () => {
    renderCard(OFFERED);

    const note = screen.getByText('Read the whole postcard', PAST_THE_DRAWING);
    expect(screen.getByRole('link')).not.toContainElement(note);
    expect(note.closest('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('opens the postcard from the small postcard alone', () => {
    renderCard(OFFERED);

    const link = screen.getByRole('link');
    expect(link).toHaveAccessibleName(/^Open postcard:/);
    expect(link).not.toContainElement(
      screen.getByText(OFFERED.message, PAST_THE_DRAWING),
    );
    expect(link).not.toHaveClass('after:absolute');
  });

  it('is one link to the postcard, named for who wrote to whom', () => {
    renderCard(OFFERED);

    expect(
      screen.getByRole('link', {
        name: 'Open postcard: Cara Diaz gave feedback to Ben Carter',
      }),
    ).toHaveAttribute('href', '/home?feedback=fb-1');
  });

  it('draws no question on Offered Feedback', () => {
    renderCard(OFFERED);

    expect(
      screen.queryByText(/asked:/, PAST_THE_DRAWING),
    ).not.toBeInTheDocument();
  });

  it('puts the question above the answer on Requested Feedback', () => {
    renderCard(REQUESTED);

    const card = screen.getByRole('article');
    expect(
      within(card).getByText('Requested', PAST_THE_DRAWING),
    ).toBeInTheDocument();
    const question = within(card).getByText(
      'How clear was the plan?',
      PAST_THE_DRAWING,
    );
    const answer = within(card).getByText(REQUESTED.message, PAST_THE_DRAWING);
    expect(question.compareDocumentPosition(answer)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(card).toHaveTextContent('Ben Carter asked:');
  });

  it('says "You asked:" to the person who asked', () => {
    renderCard({
      ...REQUESTED,
      receivers: [ANN],
      request: { ...QUESTION, requester: ANN },
    });

    expect(screen.getByRole('article')).toHaveTextContent('You asked:');
  });

  describe('how much of the words a card shows', () => {
    it('cuts an Offered message at three lines', () => {
      renderCard(OFFERED);

      expect(
        screen.getByText(OFFERED.message, PAST_THE_DRAWING).closest('p'),
      ).toHaveClass('line-clamp-3');
    });

    it('cuts the question at two lines', () => {
      renderCard(REQUESTED);

      expect(
        screen
          .getByText('How clear was the plan?', PAST_THE_DRAWING)
          .closest('p'),
      ).toHaveClass('line-clamp-2');
    });

    it('never cuts the answer the card is for', () => {
      renderCard(REQUESTED);

      expect(
        screen.getByText(REQUESTED.message, PAST_THE_DRAWING).closest('p')
          ?.className,
      ).not.toMatch(/line-clamp/);
    });
  });

  describe('@ and #', () => {
    const TAGS = {
      workspaceGoals: [{ name: 'Ownership' }],
      mentions: [{ slug: 'ann.lee', displayName: 'Ann' }],
    };
    const TAGGED = 'Thanks to @ann.lee, #Ownership at its best.';

    it('binds them in an Offered message', () => {
      renderCard({ ...OFFERED, message: TAGGED, messageTags: TAGS });

      const card = screen.getByRole('article');
      expect(card).toHaveTextContent('@Ann');
      expect(card).toHaveTextContent('#Ownership');
      expect(card).not.toHaveTextContent('ann.lee');
    });

    it('binds the question and the answer each by its own', () => {
      renderCard({
        ...REQUESTED,
        message: 'Thanks to @ann.lee.',
        messageTags: { workspaceGoals: [], mentions: TAGS.mentions },
        request: {
          ...QUESTION,
          message: 'How was #Ownership here?',
          messageTags: { workspaceGoals: TAGS.workspaceGoals, mentions: [] },
        },
      });

      const card = screen.getByRole('article');
      expect(card).toHaveTextContent('@Ann');
      expect(card).toHaveTextContent('#Ownership');
    });
  });

  describe('who else was asked', () => {
    const openAnswers = () =>
      userEvent.click(screen.getByRole('button', { name: 'Show answers' }));

    const rows = () =>
      within(screen.getByRole('list', { name: /^Also asked/ })).getAllByRole(
        'listitem',
      );

    const withAsked = (...others: HomeFeedAsk[]): HomeFeedItem => ({
      ...REQUESTED,
      request: {
        ...QUESTION,
        asked: [answered(CARA, 'It was clear.'), ...others],
      },
    });

    it('starts closed, with how they stand and their faces', () => {
      renderCard(REQUESTED);

      expect(
        screen.getByText(/^Also asked/, PAST_THE_DRAWING),
      ).toHaveTextContent('Also asked (1 answer, 1 pending)');
      expect(
        screen.getByRole('button', {
          name: 'Dao Prasert and Nok Wattana. Show who else was asked',
        }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
      expect(
        screen.queryByText('I would add who to call.', PAST_THE_DRAWING),
      ).not.toBeInTheDocument();
    });

    const hidden = (who: typeof DAO): HomeFeedAsk => ({
      person: who,
      status: 'ANSWERED',
      answer: null,
    });

    it('counts an answer the reader may not read as an answer, beside one they may', async () => {
      renderCard(withAsked(answered(NOK, 'Mine to read.'), hidden(DAO)));

      expect(
        screen.getByText(/^Also asked/, PAST_THE_DRAWING),
      ).toHaveTextContent('Also asked (2 answers)');

      await openAnswers();

      expect(rows()).toHaveLength(2);
      expect(rows()[0]).toHaveTextContent('Mine to read.');
      expect(rows()[1]).toHaveTextContent('Dao Prasert');
      expect(rows()[1]).toHaveTextContent('Answered');
    });

    it('keeps an answer hidden from someone still waiting', () => {
      renderCard(withAsked(hidden(DAO), waiting(NOK)));

      expect(
        screen.getByText(/^Also asked/, PAST_THE_DRAWING),
      ).toHaveTextContent('Also asked (1 answer, 1 pending)');
    });

    it('lists each name and status on a press of the faces, and no answers', async () => {
      renderCard(REQUESTED);

      await userEvent.click(
        screen.getByRole('button', { name: /Show who else was asked/ }),
      );

      const list = within(await screen.findByRole('dialog'));
      expect(list.getByRole('heading')).toHaveTextContent('Also asked');
      const [dao, nok] = list.getAllByRole('listitem');
      expect(dao).toHaveTextContent('Dao Prasert');
      expect(dao).toHaveTextContent('Answered');
      expect(nok).toHaveTextContent('Nok Wattana');
      expect(nok).toHaveTextContent('Pending');
      expect(
        list.queryByText('I would add who to call.', PAST_THE_DRAWING),
      ).not.toBeInTheDocument();
    });

    it('calls the reader "You" in the list', async () => {
      renderCard(withAsked(waiting(ANN)));

      await userEvent.click(
        screen.getByRole('button', { name: /Show who else was asked/ }),
      );

      const list = within(await screen.findByRole('dialog'));
      expect(list.getByText('You', PAST_THE_DRAWING)).toBeInTheDocument();
    });

    it('offers no answers to open when nobody else has answered', () => {
      renderCard(withAsked(waiting(DAO)));

      expect(
        screen.queryByRole('button', { name: 'Show answers' }),
      ).not.toBeInTheDocument();
    });

    it('opens the answers in place, without the faces, and closes them again', async () => {
      renderCard(REQUESTED);
      expect(
        screen.getByRole('button', { name: 'Show answers' }),
      ).toHaveAttribute('aria-expanded', 'false');

      await openAnswers();

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Show who else was asked/ }),
      ).not.toBeInTheDocument();
      const [dao, nok] = rows();
      expect(rows()).toHaveLength(2);
      expect(dao).toHaveTextContent('Dao Prasert');
      expect(dao).toHaveTextContent('Answered');
      expect(dao).toHaveTextContent('I would add who to call.');
      expect(nok).toHaveTextContent('Nok Wattana');
      expect(nok).toHaveTextContent('Pending');
      expect(
        screen
          .getByText(REQUESTED.message, PAST_THE_DRAWING)
          .compareDocumentPosition(dao as Node),
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

      const hide = screen.getByRole('button', { name: 'Hide answers' });
      expect(hide).toHaveAttribute('aria-expanded', 'true');
      await userEvent.click(hide);

      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('offers nothing to press on a row', async () => {
      renderCard(REQUESTED);
      await openAnswers();

      for (const row of rows()) {
        expect(within(row).queryByRole('button')).not.toBeInTheDocument();
        expect(within(row).queryByRole('link')).not.toBeInTheDocument();
      }
    });

    it('puts those who answered before those still waiting', async () => {
      renderCard(withAsked(waiting(NOK), answered(DAO, 'Add who to call.')));
      await openAnswers();

      expect(rows()[0]).toHaveTextContent('Dao Prasert');
      expect(rows()[1]).toHaveTextContent('Nok Wattana');
    });

    it.each([
      [
        'both',
        [answered(DAO, 'Yes.'), answered(NOK, 'Yes.'), waiting(ANN)],
        'Also asked (2 answers, 1 pending)',
      ],
      ['one answer', [answered(DAO, 'Yes.')], 'Also asked (1 answer)'],
      ['nobody answering', [waiting(DAO)], 'Also asked (1 pending)'],
    ])('sums up where the others stand: %s', (_case, others, title) => {
      renderCard(withAsked(...others));

      expect(
        screen.getByText(/^Also asked/, PAST_THE_DRAWING),
      ).toHaveTextContent(title);
    });

    it('shows @ and # as they were bound', async () => {
      renderCard(
        withAsked(
          answered(DAO, 'Thanks to @ann.lee, #Ownership at its best.', {
            workspaceGoals: [{ name: 'Ownership' }],
            mentions: [{ slug: 'ann.lee', displayName: 'Ann' }],
          }),
        ),
      );
      await openAnswers();

      const [dao] = rows();
      expect(dao).toHaveTextContent('@Ann');
      expect(dao).toHaveTextContent('#Ownership');
      expect(dao).not.toHaveTextContent('ann.lee');
    });

    it('offers no more people when everyone shows', async () => {
      renderCard(REQUESTED);
      await openAnswers();

      expect(
        screen.queryByRole('button', { name: /^Show \d/ }),
      ).not.toBeInTheDocument();
    });

    it('opens the people past the first two, and closes them again', async () => {
      renderCard(
        withAsked(
          answered(DAO, 'Add who to call.'),
          waiting(NOK),
          waiting(person('chai', 'Chai Srisuk')),
        ),
      );
      await openAnswers();

      expect(rows()).toHaveLength(2);
      const more = screen.getByRole('button', { name: 'Show 1 more' });
      expect(more).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(more);

      expect(rows()).toHaveLength(3);
      const less = screen.getByRole('button', { name: 'Show less' });
      expect(less).toHaveAttribute('aria-expanded', 'true');

      await userEvent.click(less);

      expect(rows()).toHaveLength(2);
    });

    describe('a long answer', () => {
      const LONG = 'A long answer about the plan.';

      afterEach(() => {
        vi.restoreAllMocks();
      });

      it('offers nothing to open when all of it shows', async () => {
        renderCard(withAsked(answered(DAO, LONG)));
        await openAnswers();

        expect(
          screen.queryByRole('button', { name: /Read more/ }),
        ).not.toBeInTheDocument();
      });

      it('opens and closes each answer on its own', async () => {
        vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(
          80,
        );
        vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(
          40,
        );
        renderCard(withAsked(answered(DAO, LONG)));
        await openAnswers();

        expect(
          screen.getByText(LONG, PAST_THE_DRAWING).closest('p'),
        ).toHaveClass('line-clamp-2');
        const more = screen.getByRole('button', {
          name: 'Read more of what Dao Prasert answered',
        });
        expect(more).toHaveAttribute('aria-expanded', 'false');

        await userEvent.click(more);

        expect(
          screen.getByText(LONG, PAST_THE_DRAWING).closest('p'),
        ).not.toHaveClass('line-clamp-2');
        const less = screen.getByRole('button', {
          name: 'Read less of what Dao Prasert answered',
        });
        expect(less).toHaveAttribute('aria-expanded', 'true');

        await userEvent.click(less);

        expect(
          screen.getByText(LONG, PAST_THE_DRAWING).closest('p'),
        ).toHaveClass('line-clamp-2');
      });
    });

    it('shows somebody Deactivated as inactive', async () => {
      renderCard(withAsked(waiting(person('mali', 'Mali Sombat', true))));
      await userEvent.click(
        screen.getByRole('button', { name: /Show who else was asked/ }),
      );

      const list = within(await screen.findByRole('dialog'));
      expect(
        list.getByText('Mali Sombat (inactive)', PAST_THE_DRAWING),
      ).toBeInTheDocument();
    });

    it('draws nothing when nobody else was asked', () => {
      renderCard(withAsked());

      expect(
        screen.queryByText(/Also asked/, PAST_THE_DRAWING),
      ).not.toBeInTheDocument();
    });

    it('draws nothing on Offered Feedback', () => {
      renderCard(OFFERED);

      expect(
        screen.queryByText(/Also asked/, PAST_THE_DRAWING),
      ).not.toBeInTheDocument();
    });
  });

  it('folds several Receivers into a stack whose press lists them, the reader first', async () => {
    renderCard({ ...OFFERED, receivers: [BEN, ANN] });

    expect(
      screen.getByRole('link', {
        name: 'Open postcard: Cara Diaz gave feedback to you and Ben Carter',
      }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /Show who it is for/ }),
    );

    const list = within(await screen.findByRole('dialog'));
    expect(list.getByRole('heading')).toHaveTextContent('For 2 people');
    expect(list.getAllByRole('listitem').map((row) => row.textContent)).toEqual(
      [
        expect.stringContaining('Ann Lee'),
        expect.stringContaining('Ben Carter'),
      ],
    );
  });

  it('calls the reader "you" when it is for them alone', () => {
    renderCard({ ...OFFERED, receivers: [ANN] });

    expect(screen.getByText('you', PAST_THE_DRAWING)).toBeInTheDocument();
  });

  it('calls the reader "You" on what they gave', () => {
    renderCard({ ...OFFERED, giver: ANN });

    expect(screen.getByText('You', PAST_THE_DRAWING)).toBeInTheDocument();
  });

  it('says who can read it, in words', () => {
    renderCard(OFFERED);

    expect(
      screen.getByText('Everyone in the Workspace', PAST_THE_DRAWING),
    ).toBeInTheDocument();
  });

  it('says so when it was kept to Selected people', () => {
    renderCard({ ...OFFERED, visibility: 'SELECTED_PEOPLE' });

    expect(
      screen.getByText('Selected people', PAST_THE_DRAWING),
    ).toBeInTheDocument();
  });

  it('draws no Reactions', () => {
    renderCard(OFFERED);

    expect(
      screen.queryByRole('list', { name: 'Reactions' }),
    ).not.toBeInTheDocument();
  });

  it('draws the postcard it is on, made small, inside the link that opens it', () => {
    renderCard(OFFERED);

    const link = screen.getByRole('link', { name: /^Open postcard:/ });
    expect(within(link).getByText('Stamp')).toBeInTheDocument();
    expect(within(link).getByText(/^Posted /)).toBeInTheDocument();
  });

  it('shows somebody Deactivated as inactive', () => {
    renderCard({ ...OFFERED, giver: person('mali', 'Mali Sombat', true) });

    expect(
      screen.getByText('Mali Sombat (inactive)', PAST_THE_DRAWING),
    ).toBeInTheDocument();
  });

  it('never offers the old cue or an edit', () => {
    renderCard(OFFERED);

    expect(
      screen.queryByText(/edit/i, PAST_THE_DRAWING),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'View postcard' }),
    ).not.toBeInTheDocument();
  });
});

describe('when a card was given', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('says how long ago', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-31T06:00:00.000Z'));

    render(
      <FeedCard item={OFFERED} readerAccountId="ann" target={{ href: '/x' }} />,
    );

    expect(screen.getByRole('article')).toHaveTextContent('3 hours ago');
  });
});
