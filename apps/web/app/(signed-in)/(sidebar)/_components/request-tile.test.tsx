import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type {
  PersonalRequest,
  PersonalRequestAsk,
} from '@/app/(signed-in)/(sidebar)/_lib/personal-item.type';
import { PLAIN_POSTCARD } from '@/app/(signed-in)/(sidebar)/_lib/plain-postcard.constant';
import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { RequestTile } from './request-tile';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/received',
}));

const NO_TAGS = { workspaceGoals: [], mentions: [] };
const REQUESTER = { name: 'Ann', photoUrl: null };

function askOf(name: string, answeredAt: string | null): PersonalRequestAsk {
  const writer = { name, photoUrl: null };
  return {
    person: {
      accountId: `account-${name}`,
      name,
      photoUrl: null,
      inactive: false,
    },
    status: answeredAt === null ? 'PENDING' : 'ANSWERED',
    answer:
      answeredAt === null
        ? null
        : {
            id: `answer-${name}`,
            message: `From ${name}`,
            messageTags: NO_TAGS,
            answeredAt,
            card: {
              kind: 'ask',
              ask: { ...PLAIN_POSTCARD, requester: REQUESTER, message: 'How?' },
              messageTags: NO_TAGS,
              answers: [
                {
                  giver: writer,
                  message: `From ${name}`,
                  messageTags: NO_TAGS,
                  stickers: [],
                  textStyle: DEFAULT_TEXT_STYLE,
                  sentOn: answeredAt,
                },
              ],
            },
          },
  };
}

function requestTo(asked: readonly PersonalRequestAsk[]): PersonalRequest {
  return {
    kind: 'REQUEST',
    id: 'request-1',
    message: 'How clear was the plan?',
    messageTags: NO_TAGS,
    visibility: 'ONLY_ME',
    requester: {
      accountId: 'account-ann',
      name: 'Ann',
      photoUrl: null,
      inactive: false,
    },
    sentAt: '2026-11-01T00:00:00.000Z',
    card: {
      kind: 'asked',
      ask: { ...PLAIN_POSTCARD, requester: REQUESTER, message: 'How?' },
      messageTags: NO_TAGS,
      sentOn: '2026-11-01T00:00:00.000Z',
    },
    asked,
  };
}

function cardsBehind(container: HTMLElement) {
  return container.querySelectorAll('[data-stack-depth]').length;
}

describe('RequestTile', () => {
  it('draws one card while one person has answered', () => {
    const { container } = render(
      <RequestTile
        request={requestTo([
          askOf('Ben', '2026-11-02T00:00:00.000Z'),
          askOf('Cara', null),
        ])}
      />,
    );

    expect(cardsBehind(container)).toBe(0);
    expect(screen.getByText('1 of 2 answered')).toBeInTheDocument();
  });

  it('stacks an earlier answer under the newest once two have answered', () => {
    const { container } = render(
      <RequestTile
        request={requestTo([
          askOf('Ben', '2026-11-02T00:00:00.000Z'),
          askOf('Cara', '2026-11-03T00:00:00.000Z'),
        ])}
      />,
    );

    expect(cardsBehind(container)).toBe(1);
  });

  it('stacks no more than two under the newest, however many answered', () => {
    const { container } = render(
      <RequestTile
        request={requestTo([
          askOf('Ben', '2026-11-02T00:00:00.000Z'),
          askOf('Cara', '2026-11-03T00:00:00.000Z'),
          askOf('Dao', '2026-11-04T00:00:00.000Z'),
          askOf('Nok', '2026-11-05T00:00:00.000Z'),
        ])}
      />,
    );

    expect(cardsBehind(container)).toBe(2);
  });

  it('draws the unanswered request alone, with nothing to open', () => {
    const { container } = render(
      <RequestTile request={requestTo([askOf('Ben', null)])} />,
    );

    expect(cardsBehind(container)).toBe(0);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
