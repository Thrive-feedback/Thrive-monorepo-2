import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FeedComposer, type FeedComposerChoice } from './feed-composer';

const TEAMMATES = [
  {
    accountId: 'mali',
    name: 'Mali Sombat',
    displayName: 'Mali',
    email: 'mali@acme.test',
    photoUrl: null,
    slug: 'mali',
  },
];

function Composer({
  onChoose,
}: {
  onChoose: (choice: FeedComposerChoice) => void;
}) {
  const [message, setMessage] = useState('');
  return (
    <FeedComposer
      writer={{ name: 'Dao Prasert', photoUrl: null }}
      teammates={TEAMMATES}
      workspaceGoals={['Ownership']}
      message={message}
      onMessageChange={setMessage}
      onChoose={onChoose}
    />
  );
}

const field = () =>
  screen.getByRole('combobox', { name: 'What you want to say' });

describe('FeedComposer', () => {
  it('invites a first line', () => {
    render(<Composer onChoose={vi.fn()} />);

    expect(field()).toHaveAttribute(
      'placeholder',
      'Share advice or ask a teammate for feedback...',
    );
  });

  it.each([
    ['Ask for feedback', 'ask'],
    ['Give feedback', 'give'],
    ['Give kudos', 'kudos'],
  ])('says %s was chosen', async (name, choice) => {
    const onChoose = vi.fn();
    render(<Composer onChoose={onChoose} />);

    await userEvent.click(screen.getByRole('button', { name }));

    expect(onChoose).toHaveBeenCalledExactlyOnceWith(choice);
  });

  it('completes a teammate as they are typed', async () => {
    render(<Composer onChoose={vi.fn()} />);

    await userEvent.type(field(), '@ma');

    expect(await screen.findByRole('option', { name: /Mali/ })).toBeVisible();
  });

  it('does nothing on Enter, because nothing has been chosen yet', async () => {
    const onChoose = vi.fn();
    render(<Composer onChoose={onChoose} />);

    await userEvent.type(field(), 'Well done{Enter}');

    expect(onChoose).not.toHaveBeenCalled();
    expect(field()).toHaveValue('Well done');
  });

  it('keeps to the length a message can be', async () => {
    render(<Composer onChoose={vi.fn()} />);

    await userEvent.click(field());
    await userEvent.paste('a'.repeat(1200));

    expect(field()).toHaveValue('a'.repeat(1000));
  });

  it('loses nothing already written when a key is pressed at the limit, mid-message', async () => {
    render(<Composer onChoose={vi.fn()} />);
    const written = `${'a'.repeat(998)}zz`;
    await userEvent.click(field());
    await userEvent.paste(written);

    const box = field();
    if (!(box instanceof HTMLInputElement)) {
      throw new Error('The field is not an input.');
    }
    box.setSelectionRange(10, 10);
    await userEvent.keyboard('x');

    expect(field()).toHaveValue(written);
    expect(field()).toHaveProperty('selectionStart', 10);
  });
});
