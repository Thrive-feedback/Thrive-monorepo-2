import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('is named by its content', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('is reached from the keyboard', async () => {
    const user = userEvent.setup();
    render(<Button>Save</Button>);

    await user.tab();

    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
  });

  it('does not submit the form it sits in unless asked to', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((event: React.FormEvent) =>
      event.preventDefault(),
    );
    render(
      <form onSubmit={handleSubmit}>
        <Button>Cancel</Button>
        <Button type="submit">Save</Button>
      </form>,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handleSubmit).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('cannot be pressed while disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Save
      </Button>,
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(handleClick).not.toHaveBeenCalled();
  });
});
