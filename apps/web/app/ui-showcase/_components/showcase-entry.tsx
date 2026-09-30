import { Text } from '@/components/atoms/text';
import { CodeBlock } from './code-block';
import { type AtomicLevel, LevelBadge } from './level-badge';
import { type PropRow, PropsTable } from './props-table';

export type ShowcaseEntryProps = {
  name: string;
  level: AtomicLevel;
  source: string;
  origin: 'shadcn' | 'thrive';
  summary: string;
  useFor: string;
  avoidFor: string;
  usage: string;
  props: readonly PropRow[];
  accessibility: readonly string[];
  children: React.ReactNode;
};

/**
 * One component's page, under its breadcrumb: what it is for, every state side by side, then the props, the code
 * to use it and what a keyboard or screen-reader user gets. `children` are the state cells.
 */
export function ShowcaseEntry({
  name,
  level,
  source,
  origin,
  summary,
  useFor,
  avoidFor,
  usage,
  props,
  accessibility,
  children,
}: ShowcaseEntryProps) {
  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Text variant="h5" as="h1">
            {name}
          </Text>
          <LevelBadge level={level} />
          <Text
            variant="caption"
            tone="muted"
            className="rounded-full border border-line px-2.5 py-0.5"
          >
            {origin === 'shadcn'
              ? 'shadcn/ui, restyled with tokens'
              : 'Thrive, no shadcn equivalent'}
          </Text>
        </div>
        <Text tone="muted" className="max-w-2xl">
          {summary}
        </Text>
        <code className="text-caption text-foreground-muted">{source}</code>
      </header>

      <dl className="grid gap-4 text-body2 sm:grid-cols-2">
        <div className="rounded-surface bg-success-subtle p-4">
          <dt className="font-medium">Use it for</dt>
          <dd className="mt-1 text-foreground-muted">{useFor}</dd>
        </div>
        <div className="rounded-surface bg-caution-subtle p-4">
          <dt className="font-medium">Not for</dt>
          <dd className="mt-1 text-foreground-muted">{avoidFor}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-3">
        <Text variant="subtitle2" as="h2">
          States
        </Text>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {children}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Text variant="subtitle2" as="h2">
          Usage
        </Text>
        <CodeBlock code={usage} label={`${name} usage`} />
      </div>

      <div className="flex flex-col gap-3">
        <Text variant="subtitle2" as="h2">
          Props
        </Text>
        <PropsTable caption={`${name} props`} rows={props} />
      </div>

      <div className="flex flex-col gap-3">
        <Text variant="subtitle2" as="h2">
          Accessibility
        </Text>
        <ul className="flex list-disc flex-col gap-1 ps-5 text-body2 text-foreground-muted">
          {accessibility.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export type StateCellProps = {
  label: string;
  hint?: string;
  children: React.ReactNode;
};

/** One state, labelled. `hint` says how to reach a state that cannot be shown standing still. */
export function StateCell({ label, hint, children }: StateCellProps) {
  return (
    <figure className="flex flex-col overflow-hidden rounded-surface border border-line">
      <div className="flex min-h-24 flex-1 flex-wrap items-center justify-center gap-3 p-4">
        {children}
      </div>
      <figcaption className="flex flex-col border-line border-t bg-surface-raised px-3 py-2">
        <Text variant="subtitle4" as="span">
          {label}
        </Text>
        {hint && (
          <Text variant="caption" tone="muted">
            {hint}
          </Text>
        )}
      </figcaption>
    </figure>
  );
}
