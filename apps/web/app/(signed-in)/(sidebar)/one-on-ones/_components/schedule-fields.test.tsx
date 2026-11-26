import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type {
  OneOnOneScheduleChoice,
  OneOnOneTemplate,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import { ScheduleFields } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/schedule-fields';

const KRITS_ID = '0196b4c8-0000-7000-8000-000000000011';
const OTHERS_ID = '0196b4c8-0000-7000-8000-000000000099';

const TEMPLATES: readonly OneOnOneTemplate[] = [
  {
    key: 'weekly-check-in',
    scope: 'THRIVE',
    name: 'Weekly check-in',
    suggestedWhen: 'The default for every 1:1',
    questions: ['What went well this week?'],
    changeable: false,
  },
  {
    key: '0196b4c8-0000-7000-8000-000000000012',
    scope: 'WORKSPACE',
    name: 'Team health',
    suggestedWhen: '',
    questions: ['How is the team?'],
    changeable: false,
  },
  {
    key: KRITS_ID,
    scope: 'PERSONAL',
    name: 'Sprint retro',
    suggestedWhen: '',
    questions: ['What slowed us?'],
    changeable: true,
  },
];

function choice(templateKey: string): OneOnOneScheduleChoice {
  return {
    cadence: 'WEEKLY',
    weekday: 4,
    startMinute: 600,
    lengthMinutes: 30,
    templateKey,
  };
}

describe('ScheduleFields, the template', () => {
  it('offers the templates by layer: Thrive, the Workspace, then the person’s own', async () => {
    render(
      <ScheduleFields
        value={choice('weekly-check-in')}
        templates={TEMPLATES}
        onChange={vi.fn()}
      />,
    );

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Agenda starts from' }),
    );

    const listbox = screen.getByRole('listbox');
    expect(
      within(listbox)
        .getAllByRole('group')
        .map((group) => group.textContent),
    ).toEqual([
      'ThriveWeekly check-in',
      'Your WorkspaceTeam health',
      'YoursSprint retro',
    ]);
  });

  it('says only the first question of one that says nothing about when to use it', () => {
    render(
      <ScheduleFields
        value={choice(KRITS_ID)}
        templates={TEMPLATES}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Opens with “What slowed us?”')).toBeVisible();
  });

  it('keeps a template the person’s list lacks as a choice, by its name, saying it stays', () => {
    render(
      <ScheduleFields
        value={choice(OTHERS_ID)}
        templates={TEMPLATES}
        currentTemplate={{ key: OTHERS_ID, name: 'Mint’s prep' }}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('combobox', { name: 'Agenda starts from' }),
    ).toHaveTextContent('Mint’s prep');
    expect(
      screen.getByText(/Not in your list of templates, so it stays/),
    ).toBeVisible();
  });
});
