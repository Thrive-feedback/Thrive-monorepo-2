import type { PropRow } from '@/app/ui-showcase/_components/props-table';

/** The props TextField and TextAreaField share, listed once for both showcase pages. */
export const FIELD_PROPS = [
  {
    name: 'label',
    type: 'string',
    description: 'Visible label, and the accessible name. Required.',
  },
  {
    name: 'helperText',
    type: 'string',
    description: 'One line of help under the control, read with it.',
  },
  {
    name: 'errorMessage',
    type: 'string',
    description:
      'Replaces the helper text, turns it red and marks the control aria-invalid.',
  },
  {
    name: 'required',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Adds the asterisk and the native required state.',
  },
] as const satisfies readonly PropRow[];
