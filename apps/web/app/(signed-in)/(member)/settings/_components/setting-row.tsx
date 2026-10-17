import { Text } from '@/components/atoms/text';

export type SettingRowProps = {
  label: string;
  /** A muted line under the label, saying what the control does. */
  description?: string;
  /** The control, on the right of a wide row and under the label on a narrow one. */
  children: React.ReactNode;
};

/**
 * One setting a person can act on: what it is on the left, the control on the right, and a
 * divider under it, so a section's rows line up in one column.
 */
export function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-border-subtle border-b py-5">
      <div className="flex flex-col gap-1">
        <Text as="p" variant="subtitle-4">
          {label}
        </Text>
        {description && (
          <Text as="p" variant="body-3" tone="muted">
            {description}
          </Text>
        )}
      </div>
      {children}
    </div>
  );
}

export type SettingValuesProps = {
  rows: readonly { readonly label: string; readonly value: string }[];
};

/**
 * Settings a person can read but not change, as label and value rows drawn like `SettingRow`,
 * kept a description list so each value is announced with its label.
 */
export function SettingValues({ rows }: SettingValuesProps) {
  return (
    <dl className="flex flex-col">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-border-subtle border-b py-5"
        >
          <dt className="text-subtitle-4">{row.label}</dt>
          <dd className="break-all text-body-2 text-fg-secondary">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
