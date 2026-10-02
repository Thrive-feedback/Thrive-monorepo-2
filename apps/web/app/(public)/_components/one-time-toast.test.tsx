import { render } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OneTimeToast } from './one-time-toast';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('OneTimeToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(['success', 'error'] as const)(
    'raises one %s toast and drops the query from the address',
    (type) => {
      render(<OneTimeToast type={type} message="Done" then="/login" />);

      expect(toast[type]).toHaveBeenCalledWith('Done', { id: 'Done' });
      expect(replace).toHaveBeenCalledWith('/login', { scroll: false });
    },
  );
});
