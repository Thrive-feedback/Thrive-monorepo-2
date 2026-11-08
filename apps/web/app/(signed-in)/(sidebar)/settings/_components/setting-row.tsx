import { InfoIcon } from 'lucide-react';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';

export type SettingRowProps = {
  label: string;
  /** A muted line under the label, saying what the control does or where the setting stands. */
  description?: React.ReactNode;
  /**
   * More about the setting than its description holds, behind an ⓘ after the label: shown on
   * hover or keyboard focus, and read out as the ⓘ's description. On a touch screen, where a
   * tooltip never opens, it is written out under the description instead.
   */
  info?: string;
  /** Gives the description an id, for a control it explains to point at. */
  descriptionId?: string;
  /** The control, on the right of a wide row and under the label on a narrow one. */
  children: React.ReactNode;
};

/**
 * One setting a person can act on: what it is on the left, the control on the right, so a card's
 * rows line up in one column. The card draws the line between rows. The words give way to the
 * control, wrapping beside it, until there is no room left and the control drops under them.
 */
export function SettingRow({
  label,
  description,
  descriptionId,
  info,
  children,
}: SettingRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4">
      <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
        <span className="flex items-center gap-1">
          <Text as="p" variant="subtitle-4">
            {label}
          </Text>
          {info && <SettingInfo label={label} info={info} />}
        </span>
        {description && (
          <Text as="p" id={descriptionId} variant="body-3" tone="muted">
            {description}
          </Text>
        )}
        {info && (
          // A touch screen never opens a tooltip, so there the ⓘ hides and its words are written out.
          <Text
            as="p"
            variant="body-3"
            tone="muted"
            className="hidden pointer-coarse:block"
          >
            {info}
          </Text>
        )}
      </div>
      {children}
    </div>
  );
}

type SettingInfoProps = {
  label: string;
  info: string;
};

/**
 * The ⓘ after a setting's label and what it says. A plain button rather than the icon `Button`,
 * which is a filled circle the height of a control and would stand taller than the label it
 * follows.
 */
function SettingInfo({ label, info }: SettingInfoProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`About ${label}`}
          className="inline-flex cursor-help items-center justify-center rounded-full p-1 text-fg-secondary transition-colors hover:text-fg-primary pointer-coarse:hidden"
        >
          <InfoIcon aria-hidden="true" className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{info}</TooltipContent>
    </Tooltip>
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
    <dl className="flex flex-col divide-y divide-border-subtle">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-4"
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

export type SettingRowSkeletonProps = {
  label: string;
};

/**
 * A `SettingRow` whose description and control wait on data: its label as it will read, and the
 * rest in grey.
 */
export function SettingRowSkeleton({ label }: SettingRowSkeletonProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4">
      <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
        <Text as="p" variant="subtitle-4">
          {label}
        </Text>
        <Skeleton className="w-3/4 text-body-3" />
      </div>
      <Skeleton shape="control" className="h-9 w-32 rounded-button" />
    </div>
  );
}

export type SettingValuesSkeletonProps = {
  labels: readonly string[];
};

/** `SettingValues` still loading: each label as it will read, beside its value in grey. */
export function SettingValuesSkeleton({ labels }: SettingValuesSkeletonProps) {
  return (
    <div className="flex flex-col divide-y divide-border-subtle">
      {labels.map((label) => (
        <div
          key={label}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-4"
        >
          <span className="text-subtitle-4">{label}</span>
          <Skeleton className="w-40 text-body-2" />
        </div>
      ))}
    </div>
  );
}
