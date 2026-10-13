import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/atoms/table';

const MEMBERS = [
  { name: 'Tony Stark', role: 'Admin', given: 12 },
  { name: 'Pepper Potts', role: 'Member', given: 8 },
  { name: 'Happy Hogan', role: 'Member', given: 3 },
];

function MembersTable({ selectedName }: { selectedName?: string }) {
  return (
    <Table>
      <TableCaption>Members of Stark Industries</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-end">Feedback given</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {MEMBERS.map((member) => (
          <TableRow
            key={member.name}
            data-state={member.name === selectedName ? 'selected' : undefined}
          >
            <TableCell>{member.name}</TableCell>
            <TableCell>{member.role}</TableCell>
            <TableCell className="text-end">{member.given}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell className="text-end">23</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

export function TableEntry() {
  return (
    <ShowcaseEntry
      name="Table"
      level="atom"
      origin="shadcn"
      source="components/atoms/table.tsx — Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption"
      summary="Rows of data in named columns."
      useFor="Comparing several things across the same few facts: members, invitations, results."
      avoidFor="Laying out a page, or a single list of one fact each (a list reads better)."
      usage={`import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/atoms/table';

<Table>
  <TableCaption>Members of Stark Industries</TableCaption>
  <TableHeader>
    <TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    <TableRow><TableCell>Tony Stark</TableCell><TableCell>Admin</TableCell></TableRow>
  </TableBody>
</Table>`}
      props={[
        {
          name: 'scope',
          type: "'col' | 'row'",
          defaultValue: "'col'",
          description: 'On TableHead: whether it heads a column or a row.',
        },
        {
          name: 'data-state',
          type: "'selected'",
          description: 'On TableRow: marks a row the person has chosen.',
        },
      ]}
      accessibility={[
        'Real table elements, so a screen reader moves by row and column and reads each cell with its header.',
        'The caption names the table.',
        'On a narrow screen the table scrolls sideways inside its own box.',
      ]}
    >
      <StateCell label="Default">
        <MembersTable />
      </StateCell>
      <StateCell label="A selected row">
        <MembersTable selectedName="Pepper Potts" />
      </StateCell>
      <StateCell label="Empty">
        <Table>
          <TableCaption>Pending invitations</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Sent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={2}
                className="py-6 text-center text-fg-secondary"
              >
                No invitations waiting.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function TablePreview() {
  return (
    <Table>
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
    </Table>
  );
}
