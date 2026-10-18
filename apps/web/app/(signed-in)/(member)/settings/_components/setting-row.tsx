import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';

export type SettingRowProps = {
  label: string;
  /** A muted line under the label, saying what the control does. */
  description?: string;
  /** Gives the description an id, for a control it explains to point at. */
  descriptionId?: string;
  /** The control, on the right of a wide row and under the label on a narrow one. */
  children: React.ReactNode;
};

/**
 * One setting a person can act on: what it is on the left, the control on the right, and a
 * divider under it, so a section's rows line up in one column.
 */
export function SettingRow({
  label,
  description,
  descriptionId,
  children,
}: SettingRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-border-subtle border-b py-5">
      <div className="flex flex-col gap-1">
        <Text as="p" variant="subtitle-4">
          {label}
        </Text>
        {description && (
          <Text as="p" id={descriptionId} variant="body-3" tone="muted">
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

/**
 * A `SettingRow` whose description and control wait on data: its label as it will read, and the
 * rest in grey.
 */
export function SettingRowSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-border-subtle border-b py-5">
      <div className="flex flex-1 flex-col gap-1">
        <Text as="p" variant="subtitle-4">
          {label}
        </Text>
        <Skeleton className="w-3/4 text-body-3" />
      </div>
      <Skeleton shape="control" className="h-9 w-32 rounded-button" />
    </div>
  );
}

/** `SettingValues` still loading: each label as it will read, beside its value in grey. */
export function SettingValuesSkeleton({
  labels,
}: {
  labels: readonly string[];
}) {
  return (
    <div className="flex flex-col">
      {labels.map((label) => (
        <div
          key={label}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-border-subtle border-b py-5"
        >
          <span className="text-subtitle-4">{label}</span>
          <Skeleton className="w-40 text-body-2" />
        </div>
      ))}
    </div>
  );
}
