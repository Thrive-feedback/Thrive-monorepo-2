import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type HomeTab, ROUTES } from '@/lib/routes.constant';
import { HomeTabs } from './home-tabs';

const linkTo = (tab: HomeTab) => ({ href: ROUTES.homeTab(tab) });

describe('HomeTabs', () => {
  it('links each tab to its address, in order', () => {
    render(
      <HomeTabs tab="workspace" targetFor={linkTo}>
        <p>panel</p>
      </HomeTabs>,
    );

    expect(
      within(screen.getByRole('navigation', { name: 'Feedback' }))
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Workspace feed', '/home'],
      ['Shared with me', '/home?tab=shared'],
      ['My requests', '/home?tab=my-requests'],
      ['Waiting for me', '/home?tab=waiting'],
      ['Feedback for me', '/home?tab=received'],
    ]);
  });

  it('offers only the tabs it is given, in their order', () => {
    render(
      <HomeTabs
        tab="shared"
        tabs={['shared', 'my-requests', 'waiting']}
        targetFor={linkTo}
      >
        <p>panel</p>
      </HomeTabs>,
    );

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(
      ['Shared with me', 'My requests', 'Waiting for me'],
    );
  });

  it('marks the open tab and draws what it is given beneath', () => {
    render(
      <HomeTabs tab="waiting" targetFor={linkTo}>
        <p>waiting panel</p>
      </HomeTabs>,
    );

    expect(
      screen.getByRole('link', { name: 'Waiting for me' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('link', { name: 'Workspace feed' }),
    ).not.toHaveAttribute('aria-current');
    expect(screen.getByText('waiting panel')).toBeInTheDocument();
  });

  it('is a row of pressed and unpressed buttons when given callbacks', async () => {
    const user = userEvent.setup();
    const chosen = vi.fn();
    render(
      <HomeTabs
        tab="workspace"
        targetFor={(tab) => ({ onSelect: () => chosen(tab) })}
      >
        <p>panel</p>
      </HomeTabs>,
    );

    expect(screen.queryByRole('link')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Workspace feed' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Waiting for me' }));

    expect(chosen).toHaveBeenCalledWith('waiting');
  });
});
