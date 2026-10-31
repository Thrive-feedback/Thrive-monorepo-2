import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeedCard } from '@/components/organisms/feed-card/feed-card';
import {
  OFFERED_CASES,
  REQUESTED_CASES,
  SAMPLE_FEED,
  SAMPLE_READER,
  SAMPLE_TARGET,
} from './feed-card-samples.constant';

const ALL_CASES = [
  ...OFFERED_CASES,
  ...REQUESTED_CASES,
  ...SAMPLE_FEED.map((item) => ({ label: item.id, item })),
];

/** The showcase says these are cases Home can draw, so these hold it to what the API allows. */
describe('the feed card samples', () => {
  it.each(ALL_CASES.map((sample) => [sample.label, sample] as const))(
    'draws %s',
    (_label, { item }) => {
      render(
        <FeedCard
          item={item}
          readerAccountId={SAMPLE_READER}
          target={SAMPLE_TARGET}
        />,
      );

      expect(screen.getByRole('article')).toBeInTheDocument();
    },
  );

  it('never keeps the reader’s own Feedback to Selected people', () => {
    const own = ALL_CASES.filter(
      ({ item }) =>
        item.visibility === 'SELECTED_PEOPLE' &&
        (item.giver.accountId === SAMPLE_READER ||
          item.receivers.some(
            (receiver) => receiver.accountId === SAMPLE_READER,
          )),
    );

    expect(own).toEqual([]);
  });

  it('writes every answer to who asked, and to nobody else', () => {
    const answers = ALL_CASES.filter(({ item }) => item.origin === 'REQUESTED');
    for (const { item } of answers) {
      expect(item.receivers.map(({ accountId }) => accountId)).toEqual([
        item.request?.requester.accountId,
      ]);
    }
  });

  it('gives each card in the feed its own id', () => {
    expect(new Set(SAMPLE_FEED.map(({ id }) => id)).size).toBe(
      SAMPLE_FEED.length,
    );
  });

  it('never names more than five Receivers, or the Giver among them', () => {
    for (const { item } of ALL_CASES) {
      expect(item.receivers.length).toBeLessThanOrEqual(5);
      expect(item.receivers.map(({ accountId }) => accountId)).not.toContain(
        item.giver.accountId,
      );
    }
  });
});
