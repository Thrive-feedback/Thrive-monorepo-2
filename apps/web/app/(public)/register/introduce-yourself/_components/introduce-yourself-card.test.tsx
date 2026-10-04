import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/lib/test/render-with-intl';
import { IntroduceYourselfCard } from './introduce-yourself-card';

vi.mock('@/app/(public)/_lib/mock-session.service', () => ({
  signOut: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe('IntroduceYourselfCard', () => {
  it('says who is signed in and offers a way out', () => {
    renderWithIntl(<IntroduceYourselfCard email="tony@stark.com" />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Introduce yourself' }),
    ).toBeInTheDocument();
    expect(screen.getByText('tony@stark.com')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Not you?' }),
    ).toBeInTheDocument();
  });
});
