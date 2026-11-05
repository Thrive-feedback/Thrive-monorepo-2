import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GivenPostcard } from '@/components/organisms/postcard-dialog/postcard-read.type';
import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { PendingPostcardMiniature } from './pending-postcard-miniature';

const linkStatus = vi.fn();
vi.mock('next/link', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/link')>()),
  useLinkStatus: () => linkStatus(),
}));

const GIVEN: GivenPostcard = {
  kind: 'give',
  giver: { name: 'Ben Carter', photoUrl: null, inactive: false },
  receivers: [{ name: 'Ann Lee', photoUrl: null, inactive: false }],
  templateKey: 'system/postcard_template_1',
  tone: 'sage',
  textStyle: DEFAULT_TEXT_STYLE,
  stickers: [],
  stampKey: null,
  message: 'The plan was clear.',
  messageTags: NO_TEXT_TAGS,
  sentOn: '2026-10-31T03:00:00.000Z',
};

beforeEach(() => {
  linkStatus.mockReturnValue({ pending: false });
});

function miniature() {
  const { container } = render(
    <PendingPostcardMiniature card={GIVEN} size="md" />,
  );
  return container.firstElementChild;
}

describe('PendingPostcardMiniature', () => {
  it('looks as ever until its link is pressed', () => {
    expect(miniature()).not.toHaveAttribute('data-pending');
  });

  it('shows the press was felt while the postcard is on its way', () => {
    linkStatus.mockReturnValue({ pending: true });

    expect(miniature()).toHaveAttribute('data-pending');
  });
});
