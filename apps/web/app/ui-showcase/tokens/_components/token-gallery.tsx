import { Spinner } from '@/components/atoms/spinner';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import { Palette } from './palette';

/**
 * Every semantic token, shown with the name a component uses to reach it.
 *
 * The classes are written out in full, statically (`FE_04` R3) — mapping over a list of token
 * names and building `bg-${name}` would produce classes the scanner cannot see, so half of this
 * page would render unstyled. The repetition is the rule working, not a smell.
 *
 * The swatches below reference only semantic tokens. The primitive ramps are shown once, in
 * `Palette`, which paints them through inline custom properties: the theme deliberately does
 * not expose them, so `bg-primary-500` is not a class that exists.
 *
 * The grid steps up at Tailwind's own breakpoints rather than using an arbitrary
 * `repeat(auto-fill, …)` template, because `FE_04` R2 allows no arbitrary value in a class and
 * `FE_04` R7 wants mobile first, stepping up at the token breakpoints.
 */

/*
 * The design's text styles, one row each. The classes are written out rather than built from
 * the role name, for the reason in the header: `text-${role}` is invisible to the scanner.
 */
const TYPE_STYLES = [
  {
    role: 'display1',
    className: 'font-display text-display1',
    spec: 'Cooper SemiBold 72/72, -3',
  },
  {
    role: 'display2',
    className: 'font-display text-display2',
    spec: 'Cooper SemiBold 64/64, -3',
  },
  {
    role: 'display3',
    className: 'font-display text-display3',
    spec: 'Cooper SemiBold 48/56, -3',
  },
  {
    role: 'display4',
    className: 'font-display text-display4',
    spec: 'Cooper SemiBold 40/48, -0.3',
  },
  {
    role: 'display5',
    className: 'font-display text-display5',
    spec: 'Cooper SemiBold 32/40, -0.2',
  },
  {
    role: 'display6',
    className: 'font-display text-display6',
    spec: 'Cooper SemiBold 28/36, -0.2',
  },
  { role: 'h1', className: 'text-h1', spec: 'Google Sans Medium 72/72, -3' },
  { role: 'h2', className: 'text-h2', spec: 'Google Sans Medium 64/64, -3' },
  { role: 'h3', className: 'text-h3', spec: 'Google Sans Medium 48/56, -3' },
  { role: 'h4', className: 'text-h4', spec: 'Google Sans Medium 40/48, -0.3' },
  { role: 'h5', className: 'text-h5', spec: 'Google Sans Medium 32/40, -0.2' },
  { role: 'h6', className: 'text-h6', spec: 'Google Sans Medium 28/36, -0.2' },
  {
    role: 'subtitle1',
    className: 'text-subtitle1',
    spec: 'Google Sans Medium 24/32, -0.5',
  },
  {
    role: 'subtitle2',
    className: 'text-subtitle2',
    spec: 'Google Sans Medium 20/28, -0.5',
  },
  {
    role: 'subtitle3',
    className: 'text-subtitle3',
    spec: 'Google Sans Medium 16/24, -0.3',
  },
  {
    role: 'subtitle4',
    className: 'text-subtitle4',
    spec: 'Google Sans Medium 14/20',
  },
  { role: 'body1', className: 'text-body1', spec: 'Google Sans Regular 16/24' },
  { role: 'body2', className: 'text-body2', spec: 'Google Sans Regular 14/20' },
  { role: 'body3', className: 'text-body3', spec: 'Google Sans Regular 12/18' },
  {
    role: 'caption',
    className: 'text-caption',
    spec: 'Google Sans Regular 12/20',
  },
  {
    role: 'overline',
    className: 'text-overline uppercase',
    spec: 'Google Sans Medium 12/20, upper case',
  },
  {
    role: 'button-large',
    className: 'text-button-large',
    spec: 'Google Sans Medium 15/20 — Button lg',
  },
  {
    role: 'button-medium',
    className: 'text-button-medium',
    spec: 'Google Sans Medium 14/20 — Button md',
  },
  {
    role: 'button-small',
    className: 'text-button-small',
    spec: 'Google Sans Medium 13/20 — Button sm',
  },
] as const;

function TypeScale() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Text variant="subtitle1" as="h2">
          Type
        </Text>
        <Text variant="body2" tone="muted">
          One utility per text style in the design, each carrying size, line
          height, letter spacing and weight (px from Figma). Display styles also
          need font-display — or use the Text component, which adds it.
        </Text>
      </div>
      <ul className="flex flex-col divide-y divide-line rounded-surface border border-line">
        {TYPE_STYLES.map(({ role, className, spec }) => (
          <li
            key={role}
            className="flex flex-col gap-2 p-4 md:flex-row md:items-baseline md:gap-6"
          >
            <div className="flex shrink-0 flex-col md:w-56">
              <code className="text-body2">
                {role.startsWith('display')
                  ? `font-display text-${role}`
                  : `text-${role}`}
              </code>
              <span className="text-caption text-foreground-muted">{spec}</span>
            </div>
            <span className={cn('min-w-0 truncate', className)}>
              Feedback that helps
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Section({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Text variant="subtitle1" as="h2">
          {title}
        </Text>
        <Text variant="body2" tone="muted">
          {description}
        </Text>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {children}
      </div>
    </section>
  );
}

function Swatch({
  name,
  usage,
  children,
}: Readonly<{ name: string; usage: string; children: React.ReactNode }>) {
  return (
    <div className="flex flex-col overflow-hidden rounded-surface border border-line">
      <div className="flex h-16 items-center justify-center">{children}</div>
      <div className="flex flex-col gap-0.5 border-line border-t p-3">
        <code className="text-body2">{name}</code>
        <span className="text-caption text-foreground-muted">{usage}</span>
      </div>
    </div>
  );
}

export function TokenGallery() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-12">
      <header className="flex flex-col gap-2">
        <Text variant="h5" as="h1">
          Design tokens
        </Text>
        <Text tone="muted" className="max-w-2xl">
          The semantic layer: every colour, radius and family a component is
          allowed to reference. Values come from the retired build and the names
          are a proposal until design agrees them, so expect both to move.
        </Text>
      </header>

      <Palette />

      <Section
        title="Surfaces"
        description="Backgrounds, from furthest back to nearest front."
      >
        <Swatch name="bg-surface" usage="the page">
          <div className="h-full w-full bg-surface" />
        </Swatch>
        <Swatch name="bg-surface-raised" usage="cards, sheets, menus">
          <div className="h-full w-full bg-surface-raised" />
        </Swatch>
        <Swatch name="bg-surface-sunken" usage="wells and inset areas">
          <div className="h-full w-full bg-surface-sunken" />
        </Swatch>
        <Swatch
          name="from-backdrop to-backdrop-tint"
          usage="the wash behind a page"
        >
          <div className="h-full w-full bg-linear-to-b from-backdrop to-backdrop-tint" />
        </Swatch>
        <Swatch
          name="bg-surface-floating shadow-floating"
          usage="a panel over the backdrop"
        >
          <div className="flex h-full w-full items-center justify-center bg-linear-to-b from-backdrop to-backdrop-tint">
            <div className="h-10 w-24 rounded-floating bg-surface-floating shadow-floating" />
          </div>
        </Swatch>
      </Section>

      <Section
        title="Text and icons"
        description="Foreground content. On-action is for content sitting on a filled action."
      >
        <Swatch name="text-foreground" usage="body and headings">
          <span className="text-foreground text-subtitle2">
            Ask for feedback
          </span>
        </Swatch>
        <Swatch name="text-foreground-muted" usage="secondary and helper text">
          <span className="text-foreground-muted text-subtitle2">Optional</span>
        </Swatch>
        <Swatch
          name="text-foreground-on-action"
          usage="label on a filled action"
        >
          <span className="rounded-control bg-action px-3 py-1.5 text-foreground-on-action">
            Send
          </span>
        </Swatch>
        <Swatch name="text-brand" usage="brand text that is not an action">
          <span className="text-brand text-subtitle2">Thrive</span>
        </Swatch>
        <Swatch name="text-link" usage="inline links">
          <span className="text-link text-subtitle2 underline">
            Privacy Policy
          </span>
        </Swatch>
      </Section>

      <Section title="Lines" description="Dividers and control outlines.">
        <Swatch name="border-line" usage="default divider">
          <div className="h-8 w-32 border-line border-t" />
        </Swatch>
        <Swatch name="border-line-strong" usage="emphasis, input outlines">
          <div className="h-8 w-32 border-line-strong border-t" />
        </Swatch>
      </Section>

      <Section
        title="Action"
        description="The primary action and the states it needs to be usable."
      >
        <Swatch name="bg-action" usage="resting">
          <div className="h-full w-full bg-action" />
        </Swatch>
        <Swatch name="bg-action-hover" usage="hover">
          <div className="h-full w-full bg-action-hover" />
        </Swatch>
        <Swatch name="bg-action-pressed" usage="pressed">
          <div className="h-full w-full bg-action-pressed" />
        </Swatch>
        <Swatch name="bg-action-subtle" usage="selected row, quiet button">
          <div className="h-full w-full bg-action-subtle" />
        </Swatch>
      </Section>

      <Section
        title="Accent"
        description="Emphasis that is not an action to take."
      >
        <Swatch name="bg-accent" usage="highlight">
          <div className="h-full w-full bg-accent" />
        </Swatch>
        <Swatch name="bg-accent-subtle" usage="highlight wash">
          <div className="h-full w-full bg-accent-subtle" />
        </Swatch>
      </Section>

      <Section
        title="Status"
        description="Each status has a fill for text and icons, and a wash for backgrounds."
      >
        <Swatch name="text-success / bg-success-subtle" usage="it worked">
          <span className="rounded-control bg-success-subtle px-3 py-1.5 text-body2 text-success">
            Answered
          </span>
        </Swatch>
        <Swatch name="text-caution / bg-caution-subtle" usage="needs attention">
          <span className="rounded-control bg-caution-subtle px-3 py-1.5 text-body2 text-caution">
            Expiring
          </span>
        </Swatch>
        <Swatch
          name="text-danger / bg-danger-subtle"
          usage="it failed, or it destroys"
        >
          <span className="rounded-control bg-danger-subtle px-3 py-1.5 text-body2 text-danger">
            Expired
          </span>
        </Swatch>
        <Swatch name="text-info / bg-info-subtle" usage="neutral information">
          <span className="rounded-control bg-info-subtle px-3 py-1.5 text-body2 text-info">
            Draft
          </span>
        </Swatch>
      </Section>

      <Section
        title="Focus"
        description="Applied globally, because FE_06 wants focus visible on everything interactive: one colour and the ring width and offset. Tab to the button."
      >
        <Swatch
          name="--focus (global :focus-visible)"
          usage="keyboard focus ring"
        >
          <button
            type="button"
            className="rounded-control border border-line-strong px-3 py-1.5 text-body2"
          >
            Focus me
          </button>
        </Swatch>
      </Section>

      <Section
        title="Shape and type"
        description="Four radius roles: the mark inside a control, things you operate, things that hold content, and things that float over the page."
      >
        <Swatch name="rounded-indicator" usage="checkbox box">
          <div className="size-6 rounded-indicator bg-surface-sunken" />
        </Swatch>
        <Swatch name="rounded-control" usage="buttons, inputs, chips">
          <div className="h-10 w-32 rounded-control bg-surface-sunken" />
        </Swatch>
        <Swatch name="rounded-surface" usage="cards, sheets, dialogs">
          <div className="h-10 w-32 rounded-surface bg-surface-sunken" />
        </Swatch>
        <Swatch name="rounded-floating" usage="panels over the backdrop">
          <div className="h-10 w-32 rounded-floating bg-surface-sunken" />
        </Swatch>
        <Swatch name="font-sans" usage="everything but display (Google Sans)">
          <span className="font-sans text-subtitle2">Thrive</span>
        </Swatch>
        <Swatch name="font-display" usage="display styles (Cooper)">
          <span className="font-display text-display6">Thrive</span>
        </Swatch>
        <Swatch name="font-mono" usage="code, ids, keys">
          <span className="font-mono text-subtitle2">THV-0001</span>
        </Swatch>
      </Section>

      <Section
        title="Motion"
        description="Only the two loops the loading indicators need. Nothing else animates yet, and the pulse stops under reduced motion."
      >
        <Swatch name="animate-spin" usage="Spinner, Button loading">
          <Spinner className="size-6 text-brand" />
        </Swatch>
        <Swatch name="motion-safe:animate-pulse" usage="Skeleton">
          <div className="h-4 w-32 rounded-full bg-surface-sunken motion-safe:animate-pulse" />
        </Swatch>
      </Section>

      <TypeScale />
    </main>
  );
}
