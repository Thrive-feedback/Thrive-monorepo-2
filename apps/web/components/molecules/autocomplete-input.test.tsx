import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { HASHTAG_RULE } from '@/lib/feedback/text-tag-rules.constant';
import { AutocompleteInput } from './autocomplete-input';
import type { AutocompleteTrigger } from './use-tag-autocomplete';

const GOALS: AutocompleteTrigger = {
  rule: HASHTAG_RULE,
  label: 'Workspace Goals',
  tone: 'accent',
  options: [
    { value: 'ownership', label: '#ownership', keywords: ['ownership'] },
  ],
};

function RequestMessage() {
  const [value, setValue] = useState('');
  return (
    <AutocompleteInput
      aria-label="Request message"
      value={value}
      triggers={[GOALS]}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

describe('AutocompleteInput', () => {
  it('is a combobox that says when its suggestions are open', async () => {
    const user = userEvent.setup();
    render(<RequestMessage />);
    const message = screen.getByRole('combobox', { name: 'Request message' });

    expect(message).toHaveAttribute('aria-expanded', 'false');

    await user.type(message, 'The launch #own');

    expect(message).toHaveAttribute('aria-expanded', 'true');
    expect(message).toHaveAttribute(
      'aria-controls',
      screen.getByRole('listbox', { name: 'Workspace Goals' }).id,
    );
  });

  it('writes the Workspace Goal picked, and colours it', async () => {
    const user = userEvent.setup();
    const { container } = render(<RequestMessage />);
    const message = screen.getByRole('combobox', { name: 'Request message' });

    await user.type(message, 'The launch #OWN{Enter}');

    expect(message).toHaveValue('The launch #ownership ');
    const highlights = container.querySelector(
      '[data-slot="tag-highlights"]',
    ) as HTMLElement;
    expect(within(highlights).getByText('#ownership')).toHaveClass(
      'text-fg-accent',
    );
  });

  it('does not submit its form when Enter picks a suggestion', async () => {
    const user = userEvent.setup();
    let submitted = 0;
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted += 1;
        }}
      >
        <RequestMessage />
      </form>,
    );

    await user.type(
      screen.getByRole('combobox', { name: 'Request message' }),
      '#own{Enter}',
    );

    expect(submitted).toBe(0);
  });
});
