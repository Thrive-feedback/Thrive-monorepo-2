import { render, screen } from '@testing-library/react';
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
