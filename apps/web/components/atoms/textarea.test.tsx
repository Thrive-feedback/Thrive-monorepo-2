import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('keeps line breaks', async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Feedback" />);

    await user.type(
      screen.getByRole('textbox', { name: 'Feedback' }),
      'Line one{Enter}Line two',
    );

    expect(screen.getByRole('textbox', { name: 'Feedback' })).toHaveValue(
      'Line one\nLine two',
    );
  });
});
