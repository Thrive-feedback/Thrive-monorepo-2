import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/lib/test/render-with-intl';
import { Spinner } from './spinner';

describe('Spinner', () => {
  it('announces loading when it stands alone', () => {
    renderWithIntl(<Spinner />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });
});
