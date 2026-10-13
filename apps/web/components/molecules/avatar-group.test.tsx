import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import { AvatarGroup } from './avatar-group';

const PEOPLE = ['TS', 'PP', 'BB', 'NR', 'SR'];

function Reviewers({ max }: { max?: number }) {
  return (
    <AvatarGroup aria-label="Reviewers" max={max}>
      {PEOPLE.map((initials) => (
        <Avatar key={initials}>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      ))}
    </AvatarGroup>
  );
}

describe('AvatarGroup', () => {
  it('is a group named by its label, showing everyone when there is no max', () => {
    render(<Reviewers />);

    const group = screen.getByRole('group', { name: 'Reviewers' });
    for (const initials of PEOPLE) {
      expect(within(group).getByText(initials)).toBeInTheDocument();
    }
    expect(within(group).queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the first few and announces the rest as "N more"', () => {
    render(<Reviewers max={3} />);

    const group = screen.getByRole('group', { name: 'Reviewers' });
    for (const initials of ['TS', 'PP', 'BB']) {
      expect(within(group).getByText(initials)).toBeInTheDocument();
    }
    for (const initials of ['NR', 'SR']) {
      expect(within(group).queryByText(initials)).not.toBeInTheDocument();
    }
    expect(
      within(group).getByRole('img', { name: '2 more' }),
    ).toHaveTextContent('+2');
  });
});
