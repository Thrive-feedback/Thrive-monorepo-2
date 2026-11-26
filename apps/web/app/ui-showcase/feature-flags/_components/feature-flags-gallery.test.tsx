import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeatureFlagsGallery } from './feature-flags-gallery';

/** The row of the flag switched by `variable`, found by its row header as a reader would. */
function rowOf(variable: string) {
  const header = screen.getByRole('rowheader', {
    name: new RegExp(variable),
  });
  const row = header.closest('tr');
  if (!row) {
    throw new Error(`no row for ${variable}`);
  }
  return within(row);
}

describe('FeatureFlagsGallery', () => {
  it('lists every flag the web reads, by the variable that switches it', () => {
    render(
      <FeatureFlagsGallery
        flags={{ showsDashboard: false, showsHrLanding: false }}
      />,
    );

    expect(screen.getAllByRole('rowheader')).toHaveLength(2);
    for (const variable of ['USER_DASHBOARD_FLAG', 'HR_LANDING_FLAG']) {
      expect(rowOf(variable).getByText(variable)).toBeInTheDocument();
    }
  });

  it('says what the deployment answered for each flag', () => {
    render(
      <FeatureFlagsGallery
        flags={{ showsDashboard: true, showsHrLanding: false }}
      />,
    );

    expect(rowOf('USER_DASHBOARD_FLAG').getByText('On')).toBeInTheDocument();
    expect(rowOf('HR_LANDING_FLAG').getByText('Off')).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('names the pages each flag changes', () => {
    render(
      <FeatureFlagsGallery
        flags={{ showsDashboard: true, showsHrLanding: true }}
      />,
    );

    expect(
      rowOf('USER_DASHBOARD_FLAG').getByText('/dashboard'),
    ).toBeInTheDocument();
    expect(rowOf('HR_LANDING_FLAG').getByText('/')).toBeInTheDocument();
    expect(
      rowOf('HR_LANDING_FLAG').getByText('/for-teams'),
    ).toBeInTheDocument();
  });

  it('says it could not read the flags, and calls none of them off, when the API could not say', () => {
    render(<FeatureFlagsGallery flags={null} />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Couldn’t read the flags from the API.',
    );
    expect(screen.getAllByText('Unknown')).toHaveLength(2);
    const table = within(screen.getByRole('table', { name: 'Feature flags' }));
    expect(
      table.queryAllByRole('cell').filter((cell) => cell.textContent === 'Off'),
    ).toHaveLength(0);
  });
});
