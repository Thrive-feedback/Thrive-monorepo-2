import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from '@/lib/i18n/locale.action';
import { renderWithIntl } from '@/lib/test/render-with-intl';
import { LanguageSwitch } from './language-switch';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
vi.mock('@/lib/i18n/locale.action', () => ({ setLocale: vi.fn() }));

describe('LanguageSwitch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('names each language in itself and marks the current one', () => {
    renderWithIntl(<LanguageSwitch />);

    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'ไทย' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('remembers the chosen language, then re-renders the page in it', async () => {
    const user = userEvent.setup();
    renderWithIntl(<LanguageSwitch />);

    await user.click(screen.getByRole('button', { name: 'ไทย' }));

    expect(setLocale).toHaveBeenCalledWith('th');
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it('is labelled in Thai when the page is in Thai', () => {
    renderWithIntl(<LanguageSwitch />, { locale: 'th' });

    expect(screen.getByRole('group', { name: 'ภาษา' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ไทย' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
