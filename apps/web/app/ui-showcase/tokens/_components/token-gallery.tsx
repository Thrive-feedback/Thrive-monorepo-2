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
  { role: 'display-1', className: 'font-display text-display-1' },
  { role: 'display-2', className: 'font-display text-display-2' },
  { role: 'display-3', className: 'font-display text-display-3' },
  { role: 'display-4', className: 'font-display text-display-4' },
  { role: 'display-5', className: 'font-display text-display-5' },
  { role: 'display-6', className: 'font-display text-display-6' },
  { role: 'h1', className: 'text-h1' },
  { role: 'h2', className: 'text-h2' },
  { role: 'h3', className: 'text-h3' },
  { role: 'h4', className: 'text-h4' },
  { role: 'h5', className: 'text-h5' },
  { role: 'h6', className: 'text-h6' },
  { role: 'subtitle-1', className: 'text-subtitle-1' },
  { role: 'subtitle-2', className: 'text-subtitle-2' },
  { role: 'subtitle-3', className: 'text-subtitle-3' },
  { role: 'subtitle-4', className: 'text-subtitle-4' },
  {
    role: 'subtitle-display-1',
    className: 'font-display text-subtitle-display-1',
  },
  {
    role: 'subtitle-display-2',
    className: 'font-display text-subtitle-display-2',
  },
  {
    role: 'subtitle-display-3',
    className: 'font-display text-subtitle-display-3',
  },
  {
    role: 'subtitle-display-4',
    className: 'font-display text-subtitle-display-4',
  },
  {
    role: 'subtitle-handwrite-1',
    className: 'font-handwrite text-subtitle-handwrite-1',
  },
  {
    role: 'subtitle-handwrite-2',
    className: 'font-handwrite text-subtitle-handwrite-2',
  },
  {
    role: 'subtitle-handwrite-3',
    className: 'font-handwrite text-subtitle-handwrite-3',
  },
  {
    role: 'subtitle-handwrite-4',
    className: 'font-handwrite text-subtitle-handwrite-4',
  },
  { role: 'body-1', className: 'text-body-1' },
  { role: 'body-2', className: 'text-body-2' },
  { role: 'body-3', className: 'text-body-3' },
  { role: 'quote', className: 'font-display text-quote' },
  { role: 'code', className: 'font-mono text-code' },
  { role: 'button-md', className: 'text-button-md' },
  { role: 'button-sm', className: 'text-button-sm' },
  { role: 'button-xs', className: 'text-button-xs' },
  { role: 'input-label-md', className: 'text-input-label-md' },
  { role: 'input-label-sm', className: 'text-input-label-sm' },
  { role: 'input-label-xs', className: 'text-input-label-xs' },
  { role: 'input-value-md', className: 'text-input-value-md' },
  { role: 'input-value-sm', className: 'text-input-value-sm' },
  { role: 'input-value-xs', className: 'text-input-value-xs' },
  { role: 'input-helper', className: 'text-input-helper' },
  { role: 'table-header', className: 'text-table-header' },
  { role: 'list-subheader', className: 'text-list-subheader' },
  { role: 'label', className: 'text-label' },
  { role: 'caption', className: 'text-caption' },
  { role: 'overline', className: 'text-overline uppercase' },
  { role: 'tag', className: 'text-tag' },
] as const;

function TypeScale() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Text variant="subtitle-1" as="h2">
          Type
        </Text>
        <Text variant="body-2" tone="muted">
          One utility per type role in the blueprint, each carrying size, line
          height, letter spacing and weight, and stepping up at the tablet and
          desktop breakpoints. A utility cannot carry a family, so display,
          handwrite and code roles also need their font class — or use the Text
          component, which adds it. Resize the window to see the steps.
        </Text>
      </div>
      <ul className="flex flex-col divide-y divide-border-default rounded-surface border border-border-default">
        {TYPE_STYLES.map(({ role, className }) => (
          <li
            key={role}
            className="flex flex-col gap-2 p-4 md:flex-row md:items-baseline md:gap-6"
          >
            <div className="flex shrink-0 flex-col md:w-56">
              <code className="text-body-2">{className}</code>
              <span className="text-caption text-fg-secondary">{role}</span>
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
        <Text variant="subtitle-1" as="h2">
          {title}
        </Text>
        <Text variant="body-2" tone="muted">
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
    <div className="flex flex-col overflow-hidden rounded-surface border border-border-default">
      <div className="flex h-16 items-center justify-center">{children}</div>
      <div className="flex flex-col gap-0.5 border-border-default border-t p-3">
        <code className="text-body-2">{name}</code>
        <span className="text-caption text-fg-secondary">{usage}</span>
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
          The semantic layer: every colour, radius, shadow and family a
          component is allowed to reference, generated from the design's
          blueprint. Switch the theme in the navbar to see the dark mode.
        </Text>
      </header>

      <Palette />

      <Section
        title="Surfaces"
        description="Backgrounds, from furthest back to nearest front."
      >
        <Swatch name="bg-surface-base" usage="the page">
          <div className="h-full w-full bg-surface-base" />
        </Swatch>
        <Swatch name="bg-surface-raised" usage="cards, sheets, menus">
          <div className="h-full w-full bg-surface-raised" />
        </Swatch>
        <Swatch name="bg-surface-subtle" usage="wells and inset areas">
          <div className="h-full w-full bg-surface-subtle" />
        </Swatch>
        <Swatch
          name="from-surface-base to-surface-subtle"
          usage="the wash behind a page"
        >
          <div className="h-full w-full bg-linear-to-b from-surface-base to-surface-subtle" />
        </Swatch>
        <Swatch
          name="bg-surface-overlay shadow-med"
          usage="a panel over the backdrop"
        >
          <div className="flex h-full w-full items-center justify-center bg-linear-to-b from-surface-base to-surface-subtle">
            <div className="h-10 w-24 rounded-page bg-surface-overlay shadow-med" />
          </div>
        </Swatch>
      </Section>

      <Section
        title="Text and icons"
        description="Foreground content. On-action is for content sitting on a filled action."
      >
        <Swatch name="text-fg-primary" usage="body and headings">
          <span className="text-fg-primary text-subtitle-2">
            Ask for feedback
          </span>
        </Swatch>
        <Swatch name="text-fg-secondary" usage="secondary and helper text">
          <span className="text-fg-secondary text-subtitle-2">Optional</span>
        </Swatch>
        <Swatch name="text-fg-on-action" usage="label on a filled action">
          <span className="rounded-element bg-action-primary px-3 py-1.5 text-fg-on-action">
            Send
          </span>
        </Swatch>
        <Swatch name="text-fg-accent" usage="brand text that is not an action">
          <span className="text-fg-accent text-subtitle-2">Thrive</span>
        </Swatch>
        <Swatch name="text-fg-disabled" usage="disabled labels">
          <span className="text-fg-disabled text-subtitle-2">Unavailable</span>
        </Swatch>
        <Swatch name="text-fg-accent" usage="inline links">
          <span className="text-fg-accent text-subtitle-2 underline">
            Privacy Policy
          </span>
        </Swatch>
      </Section>

      <Section title="Lines" description="Dividers and control outlines.">
        <Swatch name="border-border-default" usage="default divider">
          <div className="h-8 w-32 border-border-default border-t" />
        </Swatch>
        <Swatch name="border-border-strong" usage="emphasis, input outlines">
          <div className="h-8 w-32 border-border-strong border-t" />
        </Swatch>
        <Swatch name="border-border-subtle" usage="quiet divider">
          <div className="h-8 w-32 border-border-subtle border-t" />
        </Swatch>
        <Swatch name="border-border-muted" usage="disabled outline">
          <div className="h-8 w-32 border-border-muted border-t" />
        </Swatch>
      </Section>

      <Section
        title="Action"
        description="The primary action and the states it needs to be usable. Secondary and neutral actions follow the same pattern."
      >
        <Swatch name="bg-action-primary" usage="resting">
          <div className="h-full w-full bg-action-primary" />
        </Swatch>
        <Swatch name="bg-action-primary-hover" usage="hover">
          <div className="h-full w-full bg-action-primary-hover" />
        </Swatch>
        <Swatch name="bg-action-primary-active" usage="pressed">
          <div className="h-full w-full bg-action-primary-active" />
        </Swatch>
        <Swatch
          name="bg-action-primary-surface"
          usage="selected row, quiet button"
        >
          <div className="h-full w-full bg-action-primary-surface" />
        </Swatch>
      </Section>

      <Section
        title="Secondary action"
        description="The second action ramp, standing in for what used to be the accent."
      >
        <Swatch name="bg-action-secondary" usage="highlight">
          <div className="h-full w-full bg-action-secondary" />
        </Swatch>
        <Swatch name="bg-action-secondary-surface" usage="highlight wash">
          <div className="h-full w-full bg-action-secondary-surface" />
        </Swatch>
      </Section>

      <Section
        title="Status"
        description="Each status has a fill for text and icons, and a wash for backgrounds."
      >
        <Swatch
          name="text-status-success-fg / bg-status-success-surface"
          usage="it worked"
        >
          <span className="rounded-element bg-status-success-surface px-3 py-1.5 text-body-2 text-status-success-fg">
            Answered
          </span>
        </Swatch>
        <Swatch
          name="text-status-warning-fg / bg-status-warning-surface"
          usage="needs attention"
        >
          <span className="rounded-element bg-status-warning-surface px-3 py-1.5 text-body-2 text-status-warning-fg">
            Expiring
          </span>
        </Swatch>
        <Swatch
          name="text-status-error-fg / bg-status-error-surface"
          usage="it failed, or it destroys"
        >
          <span className="rounded-element bg-status-error-surface px-3 py-1.5 text-body-2 text-status-error-fg">
            Expired
          </span>
        </Swatch>
        <Swatch
          name="text-status-info-fg / bg-status-info-surface"
          usage="neutral information"
        >
          <span className="rounded-element bg-status-info-surface px-3 py-1.5 text-body-2 text-status-info-fg">
            Draft
          </span>
        </Swatch>
      </Section>

      <Section
        title="Focus"
        description="Applied globally, because FE_06 wants focus visible on everything interactive: one colour and the ring width and offset. Tab to the button."
      >
        <Swatch
          name="--focus-ring (global :focus-visible)"
          usage="keyboard focus ring"
        >
          <button
            type="button"
            className="rounded-element border border-border-strong px-3 py-1.5 text-body-2"
          >
            Focus me
          </button>
        </Swatch>
      </Section>

      <Section
        title="Shape"
        description="The blueprint's corners, and the layout roles that pick one per device: a surface is a container on phone and tablet and a page on desktop."
      >
        <Swatch name="rounded-inner" usage="a corner inside a corner">
          <div className="size-6 rounded-inner bg-surface-subtle" />
        </Swatch>
        <Swatch name="rounded-element" usage="a badge, a menu item">
          <div className="h-10 w-32 rounded-element bg-surface-subtle" />
        </Swatch>
        <Swatch name="rounded-container" usage="a card, a panel, a dialog">
          <div className="h-10 w-32 rounded-container bg-surface-subtle" />
        </Swatch>
        <Swatch name="rounded-page" usage="a sheet, a full-width surface">
          <div className="h-10 w-32 rounded-page bg-surface-subtle" />
        </Swatch>
        <Swatch name="rounded-surface" usage="cards and panels, per device">
          <div className="h-10 w-32 rounded-surface bg-surface-subtle" />
        </Swatch>
        <Swatch name="rounded-button" usage="buttons, icon buttons">
          <div className="h-10 w-32 rounded-button bg-surface-subtle" />
        </Swatch>
        <Swatch name="rounded-input" usage="fields, selects, search">
          <div className="h-10 w-32 rounded-input bg-surface-subtle" />
        </Swatch>
        <Swatch name="rounded-chip" usage="chips, badges, tags">
          <div className="h-8 w-20 rounded-chip bg-surface-subtle" />
        </Swatch>
      </Section>

      <Section
        title="Elevation"
        description="Three heights, tinted with the darkest neutral and stronger in the dark mode."
      >
        <Swatch name="shadow-low" usage="a card resting on the page">
          <div className="h-10 w-24 rounded-container bg-surface-raised shadow-low" />
        </Swatch>
        <Swatch name="shadow-med" usage="a menu or a popover">
          <div className="h-10 w-24 rounded-container bg-surface-raised shadow-med" />
        </Swatch>
        <Swatch name="shadow-high" usage="a dialog over everything">
          <div className="h-10 w-24 rounded-container bg-surface-raised shadow-high" />
        </Swatch>
      </Section>

      <Section
        title="Families"
        description="The blueprint's three faces, plus mono for code."
      >
        <Swatch
          name="font-main"
          usage="every role but the ones below (Google Sans)"
        >
          <span className="font-main text-subtitle-2">Thrive</span>
        </Swatch>
        <Swatch
          name="font-display"
          usage="display, subtitle-display, quote (Cooper)"
        >
          <span className="font-display text-display-6">Thrive</span>
        </Swatch>
        <Swatch name="font-handwrite" usage="subtitle-handwrite (Caveat)">
          <span className="font-handwrite text-subtitle-handwrite-2">
            Thrive
          </span>
        </Swatch>
        <Swatch name="font-mono" usage="code, ids, keys">
          <span className="font-mono text-subtitle-2">THV-0001</span>
        </Swatch>
      </Section>

      <Section
        title="Motion"
        description="Only the two loops the loading indicators need. Nothing else animates yet, and the pulse stops under reduced motion."
      >
        <Swatch name="animate-spin" usage="Spinner, Button loading">
          <Spinner className="size-6 text-fg-accent" />
        </Swatch>
        <Swatch name="motion-safe:animate-pulse" usage="Skeleton">
          <div className="h-4 w-32 rounded-full bg-surface-subtle motion-safe:animate-pulse" />
        </Swatch>
      </Section>

      <TypeScale />
    </main>
  );
}
