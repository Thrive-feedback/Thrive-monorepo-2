import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeedEmpty } from './feed-empty';

describe('FeedEmpty', () => {
  it.each([
    ['all', 'No Feedback to show yet', /Start one from the box above\./],
    [
      'everyone',
      'Nothing has been shared with the whole Workspace yet.',
      /Start one from the box above\./,
    ],
    [
      'shared',
      'Nothing has been shared with you yet.',
      /Feedback a teammate shares with you will show up here\./,
    ],
  ] as const)(
    'says what %s holds when it holds nothing, and offers no button, since the composer above does',
    (show, title, description) => {
      render(<FeedEmpty show={show} />);

      expect(screen.getByRole('heading', { name: title })).toBeVisible();
      expect(screen.getByText(description)).toBeVisible();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    },
  );
});
