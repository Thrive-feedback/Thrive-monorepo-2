import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WaitingEmpty } from './waiting-empty';

describe('WaitingEmpty', () => {
  it('says nothing is waiting and what will be, and asks nothing of the person', () => {
    render(<WaitingEmpty />);

    expect(
      screen.getByRole('heading', { name: 'Nothing is waiting for you.' }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'When a teammate asks you for feedback, it waits here for your answer.',
      ),
    ).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
