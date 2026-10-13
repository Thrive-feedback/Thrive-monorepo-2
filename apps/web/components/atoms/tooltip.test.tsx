import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

function CopyTooltip() {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger>Copy</TooltipTrigger>
      <TooltipContent>Copy the invite link</TooltipContent>
    </Tooltip>
  );
}

describe('Tooltip', () => {
  it('appears on keyboard focus and describes its trigger', async () => {
    const user = userEvent.setup();
    render(<CopyTooltip />);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.tab();

    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'Copy the invite link',
    );
    expect(
      screen.getByRole('button', { name: 'Copy' }),
    ).toHaveAccessibleDescription('Copy the invite link');
  });

  it('appears on hover', async () => {
    const user = userEvent.setup();
    render(<CopyTooltip />);

    await user.hover(screen.getByRole('button', { name: 'Copy' }));

    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
  });

  it('hides on Escape', async () => {
    const user = userEvent.setup();
    render(<CopyTooltip />);

    await user.tab();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
