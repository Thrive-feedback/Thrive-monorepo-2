/**
 * Every semantic token, shown with the name a component uses to reach it.
 *
 * The classes are written out in full, statically (`FE_04` R3) — mapping over a list of token
 * names and building `bg-${name}` would produce classes the scanner cannot see, so half of this
 * page would render unstyled. The repetition is the rule working, not a smell.
 *
 * Nothing here references a primitive (`FE_03` R2), which is why the ramps do not appear: the
 * theme deliberately does not expose them, so `bg-primary-500` is not a class that exists.
 *
 * The grid steps up at Tailwind's own breakpoints rather than using an arbitrary
 * `repeat(auto-fill, …)` template, because `FE_04` R2 allows no arbitrary value in a class and
 * `FE_04` R7 wants mobile first, stepping up at the token breakpoints.
 */

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
        <h2 className="font-medium text-xl">{title}</h2>
        <p className="text-foreground-muted text-sm">{description}</p>
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
        <code className="text-sm">{name}</code>
        <span className="text-foreground-muted text-xs">{usage}</span>
      </div>
    </div>
  );
}

export function TokenGallery() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-semibold text-3xl">Design tokens</h1>
        <p className="max-w-2xl text-foreground-muted">
          The semantic layer: every colour, radius and family a component is
          allowed to reference. Values come from the retired build and the names
          are a proposal until design agrees them, so expect both to move.
        </p>
      </header>

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
          <span className="text-foreground text-lg">Ask for feedback</span>
        </Swatch>
        <Swatch name="text-foreground-muted" usage="secondary and helper text">
          <span className="text-foreground-muted text-lg">Optional</span>
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
          <span className="text-brand text-lg">Thrive</span>
        </Swatch>
        <Swatch name="text-link" usage="inline links">
          <span className="text-link text-lg underline">Privacy Policy</span>
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
          <span className="rounded-control bg-success-subtle px-3 py-1.5 text-sm text-success">
            Answered
          </span>
        </Swatch>
        <Swatch name="text-caution / bg-caution-subtle" usage="needs attention">
          <span className="rounded-control bg-caution-subtle px-3 py-1.5 text-caution text-sm">
            Expiring
          </span>
        </Swatch>
        <Swatch
          name="text-danger / bg-danger-subtle"
          usage="it failed, or it destroys"
        >
          <span className="rounded-control bg-danger-subtle px-3 py-1.5 text-danger text-sm">
            Expired
          </span>
        </Swatch>
        <Swatch name="text-info / bg-info-subtle" usage="neutral information">
          <span className="rounded-control bg-info-subtle px-3 py-1.5 text-info text-sm">
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
            className="rounded-control border border-line-strong px-3 py-1.5 text-sm"
          >
            Focus me
          </button>
        </Swatch>
      </Section>

      <Section
        title="Shape and type"
        description="Three radius roles: things you operate, things that hold content, and things that float over the page."
      >
        <Swatch name="rounded-control" usage="buttons, inputs, chips">
          <div className="h-10 w-32 rounded-control bg-surface-sunken" />
        </Swatch>
        <Swatch name="rounded-surface" usage="cards, sheets, dialogs">
          <div className="h-10 w-32 rounded-surface bg-surface-sunken" />
        </Swatch>
        <Swatch name="rounded-floating" usage="panels over the backdrop">
          <div className="h-10 w-32 rounded-floating bg-surface-sunken" />
        </Swatch>
        <Swatch name="font-sans" usage="everything">
          <span className="font-sans text-lg">Thrive</span>
        </Swatch>
        <Swatch name="font-mono" usage="code, ids, keys">
          <span className="font-mono text-lg">THV-0001</span>
        </Swatch>
      </Section>
    </main>
  );
}
