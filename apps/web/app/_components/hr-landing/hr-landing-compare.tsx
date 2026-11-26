import { LandingSection } from '@/app/_components/landing/landing-section';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/atoms/table';
import { HR_LANDING_COPY } from './hr-landing-copy.constant';

const { compare } = HR_LANDING_COPY;

/**
 * Thrive beside what HR uses today, the Google Form (brain `vision.md`) and the annual review, as
 * a real table so each cell is read with its row and column. It scrolls inside its own box on a
 * phone rather than squeezing three columns of words.
 */
export function HrLandingCompare() {
  return (
    <LandingSection id={compare.id} title={compare.title}>
      <div className="rounded-element border border-border-muted bg-surface-base">
        <Table className="min-w-2xl text-body-1">
          <TableHeader>
            <TableRow>
              <TableHead>
                <span className="sr-only">What you compare</span>
              </TableHead>
              <TableHead className="font-display text-fg-accent">
                {compare.columns.thrive}
              </TableHead>
              <TableHead>{compare.columns.form}</TableHead>
              <TableHead>{compare.columns.review}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {compare.rows.map((row) => (
              <TableRow key={row.aspect}>
                <TableHead scope="row">{row.aspect}</TableHead>
                <TableCell className="font-medium">{row.thrive}</TableCell>
                <TableCell className="text-fg-secondary">{row.form}</TableCell>
                <TableCell className="text-fg-secondary">
                  {row.review}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </LandingSection>
  );
}
