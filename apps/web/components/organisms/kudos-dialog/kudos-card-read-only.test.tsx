import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { KudosCardReadOnly } from './kudos-card-read-only';

describe('a sent Kudos card', () => {
  it('reads as it was sent, a name as the name it went by', () => {
    render(
      <KudosCardReadOnly
        message="Nice work, @ben-wong."
        tags={{
          ...NO_TEXT_TAGS,
          mentions: [{ slug: 'ben-wong', displayName: 'Ben Wong' }],
        }}
        date="31 October 2026"
        drawing={{
          templateKey: 'sky-note',
          textStyle: {
            font: 'signature',
            sizeStep: 4,
            align: 'left',
            ink: 'navy',
          },
          stickers: [],
        }}
      />,
    );

    expect(screen.getByText(/Nice work/)).toHaveTextContent(
      'Nice work, @Ben Wong.',
    );
  });

  it('has nothing to press', () => {
    render(
      <KudosCardReadOnly
        message="Thank you."
        tags={NO_TEXT_TAGS}
        date="31 October 2026"
        drawing={{
          templateKey: 'mint-breeze',
          textStyle: {
            font: 'modern',
            sizeStep: 2,
            align: 'center',
            ink: 'forest',
          },
          stickers: [],
        }}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows its words on the front, and keeps its back out of reach', () => {
    render(
      <KudosCardReadOnly
        message="Thank you."
        tags={NO_TEXT_TAGS}
        date="31 October 2026"
        drawing={{
          templateKey: 'peach-pop',
          textStyle: {
            font: 'modern',
            sizeStep: 2,
            align: 'center',
            ink: 'ink',
          },
          stickers: [],
        }}
      />,
    );

    expect(screen.getByText('Thank you.')).toBeVisible();
    expect(
      screen.queryByRole('img', { name: 'Thrive' }),
    ).not.toBeInTheDocument();
  });

  it('shows the wordmark and the day it was given on the back', () => {
    render(
      <KudosCardReadOnly
        message="Thank you."
        tags={NO_TEXT_TAGS}
        date="31 October 2026"
        side="back"
        drawing={{
          templateKey: 'peach-pop',
          textStyle: {
            font: 'modern',
            sizeStep: 2,
            align: 'center',
            ink: 'ink',
          },
          stickers: [],
        }}
      />,
    );

    expect(screen.getByRole('img', { name: 'Thrive' })).toBeVisible();
    expect(screen.getByText('31 October 2026')).toBeVisible();
  });
});
