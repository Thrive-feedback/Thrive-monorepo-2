import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

function FeedbackTabs(props: React.ComponentProps<typeof Tabs>) {
  return (
    <Tabs {...props}>
      <TabsList aria-label="Feedback">
        <TabsTrigger value="feed">Feed</TabsTrigger>
        <TabsTrigger value="mine">Mine</TabsTrigger>
      </TabsList>
      <TabsContent value="feed">Everyone's feedback</TabsContent>
      <TabsContent value="mine">My feedback</TabsContent>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('shows the panel of the chosen tab, and only that one', () => {
    render(<FeedbackTabs defaultValue="feed" />);

    expect(screen.getByRole('tab', { name: 'Feed' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      "Everyone's feedback",
    );
  });

  it('switches panel when another tab is picked', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    render(
      <FeedbackTabs defaultValue="feed" onValueChange={handleValueChange} />,
    );

    await user.click(screen.getByRole('tab', { name: 'Mine' }));

    expect(handleValueChange).toHaveBeenCalledWith('mine');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('My feedback');
  });

  it('names the list for a screen reader', () => {
    render(<FeedbackTabs defaultValue="feed" />);

    expect(
      screen.getByRole('tablist', { name: 'Feedback' }),
    ).toBeInTheDocument();
  });
});
