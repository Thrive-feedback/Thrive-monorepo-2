import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/lib/routes.constant';
import { SettingsSectionHead } from './settings-section-head';

describe('SettingsSectionHead', () => {
  it('heads the page with the section it opens, the way Home is headed', () => {
    render(<SettingsSectionHead href={ROUTES.settings.workspaceGoals} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Goals' }),
    ).toBeInTheDocument();
  });

  it('offers the way back to the menu, for a screen too narrow to show both', () => {
    render(<SettingsSectionHead href={ROUTES.settings.appearance} />);

    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      ROUTES.settings.index,
    );
  });

  it('keeps the section action beside the title', () => {
    render(
      <SettingsSectionHead
        href={ROUTES.settings.teammates}
        action={<button type="button">Invite people</button>}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Teammates' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Invite people' }),
    ).toBeInTheDocument();
  });
});
