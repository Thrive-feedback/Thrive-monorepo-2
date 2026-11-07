import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { ReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { KudosFeedCard } from './kudos-feed-card';

const READER = 'reader';

const person = (accountId: string, name: string | null) => ({
  accountId,
  name,
  photoUrl: null,
  inactive: false,
});

const kudos = (overrides: Partial<ReadKudos> = {}): ReadKudos => ({
  id: 'k1',
  giver: person('mali', 'Mali Chaiyo'),
  recipients: [person('ben', 'Ben Wong')],
  message: 'Thank you for the handover.',
  messageTags: NO_TEXT_TAGS,
  givenAt: '2026-10-31T03:00:00.000Z',
  drawing: {
    templateKey: 'cobalt-dash',
    textStyle: {
      font: 'signature',
      sizeStep: 4,
      align: 'center',
      ink: 'paper',
    },
    stickers: [],
  },
  ...overrides,
});

function draw(item: ReadKudos) {
  render(<KudosFeedCard kudos={item} readerAccountId={READER} />);
  return screen.getByRole('article');
}

describe('a Kudos on Home', () => {
  it('says who gave it to whom', () => {
    const card = draw(kudos());

    expect(within(card).getByText('Mali Chaiyo')).toBeVisible();
    expect(within(card).getByText('gave kudos')).toBeVisible();
    expect(within(card).getByText('Ben Wong')).toBeVisible();
  });

  it('says you where it names the reader', () => {
    const card = draw(
      kudos({
        giver: person(READER, 'Ann Lee'),
        recipients: [person('ben', 'Ben Wong')],
      }),
    );

    expect(card).toHaveTextContent('Yougave kudos');
  });

  it('says you when it was given to the reader', () => {
    const card = draw(kudos({ recipients: [person(READER, 'Ann Lee')] }));

    expect(within(card).getByText('you')).toBeVisible();
  });

  it('says a Kudos naming nobody is for the whole Workspace', () => {
    const card = draw(kudos({ recipients: [] }));

    expect(within(card).getByText('the whole Workspace')).toBeVisible();
  });

  it('says what it is and when', () => {
    const card = draw(kudos());

    expect(within(card).getByText('Kudos')).toBeVisible();
    expect(card.querySelector('time')).toBeInTheDocument();
  });

  it('says what was written, once to a screen reader', () => {
    draw(kudos());

    expect(
      screen
        .getAllByText('Thank you for the handover.')
        .filter((text) => !text.closest('[aria-hidden="true"]')),
    ).toHaveLength(1);
  });

  it('opens large from the small card beside it', async () => {
    const user = userEvent.setup();
    draw(kudos());

    await user.click(
      screen.getByRole('button', { name: 'Open kudos from Mali Chaiyo' }),
    );

    expect(
      screen.getByRole('dialog', { name: 'Kudos from Mali Chaiyo' }),
    ).toBeVisible();
  });

  it('leans the small card, as every card in a list does', () => {
    draw(kudos());

    const button = screen.getByRole('button', {
      name: 'Open kudos from Mali Chaiyo',
    });
    expect(
      button
        .querySelector<HTMLElement>('[aria-hidden="true"]')
        ?.style.getPropertyValue('--feed-card-tilt'),
    ).toMatch(/deg$/);
  });

  it('has no Reactions', () => {
    draw(kudos());

    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
