import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './resizable';

describe('Resizable', () => {
  it('puts a named, focusable separator with its grip between the panels', async () => {
    const user = userEvent.setup();
    render(
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize="40%">Inbox</ResizablePanel>
        <ResizableHandle hasGrip aria-label="Resize inbox" />
        <ResizablePanel>Message</ResizablePanel>
      </ResizablePanelGroup>,
    );

    await user.tab();

    const handle = screen.getByRole('separator', { name: 'Resize inbox' });
    expect(handle).toHaveFocus();
    expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    expect(handle.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
