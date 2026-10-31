import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const TEAM = [
  'Ann Lee',
  'Ben Carter',
  'Cara Diaz',
  'Dao Prasert',
  'Mali Sombat',
].map((name) => ({ id: name, name, photoUrl: null }));

describe('AvatarGroup, given people', () => {
  it('is one button that speaks every name and what pressing it does', () => {
    render(<AvatarGroup people={TEAM} max={4} listLabel="Show the team" />);

    expect(
      screen.getByRole('button', {
        name: /Ann Lee.*Mali Sombat\. Show the team/,
      }),
    ).toBeInTheDocument();
  });

  it('says who a face is on hover', async () => {
    render(<AvatarGroup people={TEAM} max={4} />);

    await userEvent.hover(screen.getByText('BC'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Ben Carter');
  });

  it('says who the "+N" stands for on hover', async () => {
    render(<AvatarGroup people={TEAM} max={4} />);

    await userEvent.hover(screen.getByText('+1'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Mali Sombat');
  });

  it('lists everyone on a press, those past the max too', async () => {
    render(<AvatarGroup people={TEAM} max={2} listTitle="The team" />);

    await userEvent.click(screen.getByRole('button'));

    const list = within(await screen.findByRole('dialog'));
    expect(list.getByRole('heading', { name: 'The team' })).toBeInTheDocument();
    for (const { name } of TEAM) {
      expect(list.getByText(name)).toBeInTheDocument();
    }
  });

  it('ends a row with what is said about that person', async () => {
    const [first, ...rest] = TEAM;
    render(
      <AvatarGroup
        people={[
          { ...(first as (typeof TEAM)[number]), trailing: 'Answered' },
          ...rest,
        ]}
      />,
    );

    await userEvent.click(screen.getByRole('button'));

    const list = within(await screen.findByRole('dialog'));
    expect(list.getAllByRole('listitem')[0]).toHaveTextContent('Answered');
  });

  it('opens the list from the keyboard', async () => {
    render(<AvatarGroup people={TEAM} />);

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('counts the people when the list has no title', async () => {
    render(<AvatarGroup people={TEAM} />);

    await userEvent.click(screen.getByRole('button'));

    expect(
      await screen.findByRole('heading', { name: '5 people' }),
    ).toBeInTheDocument();
  });
});
