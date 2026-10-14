import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './button';
import { ButtonGroup } from './button-group';

describe('ButtonGroup', () => {
  it('is announced as a group named for what its buttons choose between', () => {
    render(
      <ButtonGroup aria-label="Text alignment">
        <Button aria-pressed="true">Left</Button>
        <Button aria-pressed="false">Centre</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole('group', { name: 'Text alignment' });
    expect(group).toContainElement(
      screen.getByRole('button', { name: 'Left' }),
    );
    expect(group).toContainElement(
      screen.getByRole('button', { name: 'Centre' }),
    );
  });

  it('says which way it runs', () => {
    render(<ButtonGroup aria-label="Steps" orientation="vertical" />);

    expect(screen.getByRole('group', { name: 'Steps' })).toHaveAttribute(
      'data-orientation',
      'vertical',
    );
  });
});
