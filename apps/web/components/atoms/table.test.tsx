import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

describe('Table', () => {
  it('is a table named by its caption, with column headers and cells', () => {
    render(
      <Table>
        <TableCaption>Members</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Tony</TableCell>
            <TableCell>Admin</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    const table = screen.getByRole('table', { name: 'Members' });
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
    expect(
      within(table).getByRole('columnheader', { name: 'Name' }),
    ).toHaveAttribute('scope', 'col');
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    expect(
      within(table).getByRole('cell', { name: 'Tony' }),
    ).toBeInTheDocument();
  });
});
