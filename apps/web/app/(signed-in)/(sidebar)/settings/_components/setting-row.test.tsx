import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SettingRow, SettingValues } from './setting-row';

describe('SettingRow', () => {
  it('shows the label, its description and the control', () => {
    render(
      <SettingRow label="Theme" description="Saved in this browser.">
        <button type="button">Dark</button>
      </SettingRow>,
    );

    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByText('Saved in this browser.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dark' })).toBeInTheDocument();
  });
});

describe('SettingValues', () => {
  it('pairs each value with its label', () => {
    render(
      <SettingValues rows={[{ label: 'Email', value: 'ann@acme.test' }]} />,
    );

    expect(
      screen.getByText('Email', { selector: 'dt' }).nextElementSibling,
    ).toHaveTextContent('ann@acme.test');
  });
});

describe('SettingRow with more to say', () => {
  it('puts it behind an ⓘ named for the setting, shown on keyboard focus', async () => {
    const user = userEvent.setup();
    render(
      <SettingRow label="Discord" info="Thrive will message you there.">
        <button type="button">Link Discord</button>
      </SettingRow>,
    );

    await user.tab();

    expect(screen.getByRole('button', { name: 'About Discord' })).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Thrive will message you there.',
    );
  });

  it('writes the words out for a touch screen, where no tooltip ever opens', () => {
    render(
      <SettingRow label="Discord" info="Thrive will message you there.">
        <button type="button">Link Discord</button>
      </SettingRow>,
    );

    // Shown only on a coarse pointer; a pointer that can hover keeps the ⓘ instead.
    expect(screen.getByText('Thrive will message you there.')).toHaveClass(
      'hidden',
      'pointer-coarse:block',
    );
    expect(screen.getByRole('button', { name: 'About Discord' })).toHaveClass(
      'pointer-coarse:hidden',
    );
  });

  it('draws no ⓘ when there is nothing more to say', () => {
    render(
      <SettingRow label="Sign out">
        <button type="button">Sign out</button>
      </SettingRow>,
    );

    expect(screen.queryByRole('button', { name: /^About/ })).toBeNull();
  });
});
