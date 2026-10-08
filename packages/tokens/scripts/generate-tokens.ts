/*
 * Writes the three generated token files from the design source (`FE_03` R5, ADR 0028):
 *
 *   source/thrive.blueprint.json → src/primitives.css, src/semantic.css, src/theme.css
 *
 * Run it with `bun run tokens:generate` after replacing the blueprint export. Never edit the
 * outputs: the next run overwrites them. A value that is wrong is wrong in the blueprint.
 *
 * The blueprint stores a ramp as a seed colour and a lightness list, not as finished colours, so
 * this script derives them (ADR 0028): each step keeps the seed's OKLCH hue and chroma at the
 * step's lightness, with the chroma reduced until the colour fits sRGB. A track's
 * `adjustments.manualOverrides` pins a weight to an exact colour instead; that weight may sit
 * between the 20 steps (125, 475…), and then it exists on that track only.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Mode = 'light' | 'dark';
type Device = 'phone' | 'tablet' | 'desktop';
type ColourRef = { trackId: string; weight: number; alpha?: number };

type Blueprint = {
  project: {
    palette: {
      tracks: {
        id: string;
        seedHex: string;
        adjustments: { manualOverrides: Record<string, string> };
      }[];
      lightnessValues: number[];
    };
    typography: {
      remRootPx: number;
      system: {
        baseFontSizePx: number;
        groups: { id: string; autoLineHeightRatio: number }[];
        fonts: { id: string; families: string[] }[];
        roles: {
          id: string;
          groupId: string;
          fontId: string;
          fontWeight: number;
          stepOffset: number;
          lineHeight: { mode: string };
          letterSpacingPx: number;
          sameAsRoleId: string | null;
          unlinkedSizes: Partial<Record<Device, number>>;
          unlinkedLineHeights: Partial<Record<Device, number>>;
          unlinkedLetterSpacings: Partial<Record<Device, number>>;
        }[];
      };
    };
    semantics: { id: string; light: ColourRef; dark: ColourRef }[];
    spacing: { baseUnitPx: number; density: number };
    radius: {
      multiplier: number;
      tokens: { id: string; basePx: number; scales: boolean }[];
    };
    elevation: {
      colour: { trackId: string; weight: number };
      levels: {
        id: string;
        layers: {
          offsetXPx: number;
          offsetYPx: number;
          blurPx: number;
          spreadPx: number;
          opacity: Record<Mode, number>;
        }[];
      }[];
    };
    previewDevices: { id: Device; ratio: number }[];
    layout: {
      id: string;
      kind: 'spacing' | 'radius';
      byDevice: Record<Device, string>;
    }[];
  };
};

const ROOT = join(import.meta.dir, '..');
const SOURCE = 'source/thrive.blueprint.json';
const { project } = JSON.parse(
  readFileSync(join(ROOT, SOURCE), 'utf8'),
) as Blueprint;

/** The 20 ramp steps, in the order of the blueprint's lightness list. */
const STEPS = [25, 50, ...Array.from({ length: 18 }, (_, i) => 100 + i * 50)];

/**
 * Where each device's values start. Phone is the default; the others are the theme's `md` and
 * `lg` breakpoints, because a media query cannot read a custom property (ADR 0028).
 */
const DEVICE_MEDIA: Record<Device, string | null> = {
  phone: null,
  tablet: '(width >= 48rem)',
  desktop: '(width >= 64rem)',
};
const DEVICES: Device[] = ['phone', 'tablet', 'desktop'];

/**
 * The blueprint names typefaces; the web app's root layout loads them and sets these variables.
 * A family not listed here is written as a plain font name.
 */
const FONT_VARIABLES: Record<string, string[]> = {
  'Cooper-SemiBold': ['var(--font-cooper)'],
  'Google Sans': ['var(--font-google-sans)', "'Google Sans Fallback'"],
  Caveat: ['var(--font-caveat)'],
};

const FONT_FAMILY_NAMES: Record<string, string> = {
  display: 'display',
  main: 'main',
  'font-2': 'handwrite',
};

const WEIGHT_NAMES: Record<number, string> = {
  400: 'normal',
  500: 'medium',
  600: 'semibold',
  700: 'bold',
};

// ---------------------------------------------------------------------------------------------
// Colour: sRGB hex ⇄ OKLCH (Björn Ottosson's OKLab).

type Lch = { l: number; c: number; h: number };

function toLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function hexToOklch(hex: string): Lch {
  const [r, g, b] = [1, 3, 5].map((i) =>
    toLinear(Number.parseInt(hex.slice(i, i + 2), 16) / 255),
  ) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const h = (Math.atan2(B, A) * 180) / Math.PI;
  return { l: L, c: Math.hypot(A, B), h: h < 0 ? h + 360 : h };
}

function inSrgb({ l: L, c, h }: Lch): boolean {
  const rad = (h * Math.PI) / 180;
  const A = c * Math.cos(rad);
  const B = c * Math.sin(rad);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return rgb.every((v) => v >= -1e-6 && v <= 1 + 1e-6);
}

/** The seed's chroma at lightness `l`, reduced by bisection until it fits sRGB. */
function fitChroma(l: number, c: number, h: number): number {
  if (inSrgb({ l, c, h })) return c;
  let low = 0;
  let high = c;
  for (let i = 0; i < 32; i++) {
    const mid = (low + high) / 2;
    if (inSrgb({ l, c: mid, h })) low = mid;
    else high = mid;
  }
  return low;
}

// ---------------------------------------------------------------------------------------------
// Formatting.

function num(value: number, digits = 4): string {
  return String(Number(value.toFixed(digits)));
}

function rem(px: number): string {
  return px === 0 ? '0' : `${num(px / project.typography.remRootPx)}rem`;
}

/** `-0.6` → `n0-6`: a custom property name cannot hold a minus sign or a dot readably. */
function pxName(px: number): string {
  return `${px < 0 ? 'n' : ''}${String(Math.abs(px)).replace('.', '-')}`;
}

function cssName(id: string): string {
  return id.replace(/\./g, '-');
}

function block(selector: string, lines: string[], indent = ''): string {
  return `${indent}${selector} {\n${lines.map((l) => `${indent}  ${l}`).join('\n')}\n${indent}}`;
}

function header(what: string): string {
  return `/*
 * GENERATED from ${SOURCE} by scripts/generate-tokens.ts — do not edit (\`FE_03\` R5).
 * Change the value in the blueprint, then run \`bun run tokens:generate\` (ADR 0028).
 *
 * ${what}
 */`;
}

/** Each track's weights: the 20 steps plus any weight its overrides add. */
const WEIGHTS = Object.fromEntries(
  project.palette.tracks.map((track) => [
    track.id,
    new Set([
      ...STEPS,
      ...Object.keys(track.adjustments.manualOverrides).map(Number),
    ]),
  ]),
) as Record<string, Set<number>>;

function colourRef({ trackId, weight, alpha }: ColourRef): string {
  if (!WEIGHTS[trackId]?.has(weight)) {
    throw new Error(`${trackId}-${weight} is not a ramp step`);
  }
  const ref = `var(--${trackId}-${weight})`;
  return alpha === undefined
    ? ref
    : `color-mix(in oklch, ${ref} ${num(alpha * 100, 2)}%, transparent)`;
}

// ---------------------------------------------------------------------------------------------
// Type: one size, line height and letter spacing per role and device.

const { system } = project.typography;
const ratioOf = Object.fromEntries(
  project.previewDevices.map((d) => [d.id, d.ratio]),
) as Record<Device, number>;
const groupOf = Object.fromEntries(system.groups.map((g) => [g.id, g]));

type TypeValues = { size: number; leading: number; tracking: number };

function typeValues(
  role: (typeof system.roles)[number],
  device: Device,
): TypeValues {
  if (role.sameAsRoleId !== null || role.lineHeight.mode !== 'auto') {
    throw new Error(
      `${role.id}: only independent roles with auto line height are supported`,
    );
  }
  const size =
    role.unlinkedSizes[device] ??
    Math.round(system.baseFontSizePx * ratioOf[device] ** role.stepOffset);
  const group = groupOf[role.groupId];
  if (!group) throw new Error(`${role.id}: unknown group ${role.groupId}`);
  const leading =
    role.unlinkedLineHeights[device] ??
    Math.round(size * group.autoLineHeightRatio);
  const tracking = role.unlinkedLetterSpacings[device] ?? role.letterSpacingPx;
  return { size, leading, tracking };
}

const typeByDevice = Object.fromEntries(
  DEVICES.map((device) => [
    device,
    Object.fromEntries(system.roles.map((r) => [r.id, typeValues(r, device)])),
  ]),
) as Record<Device, Record<string, TypeValues>>;

// ---------------------------------------------------------------------------------------------
// primitives.css

function primitives(): string {
  const lines: string[] = [];

  for (const track of project.palette.tracks) {
    const seed = hexToOklch(track.seedHex);
    const overrides = track.adjustments.manualOverrides;
    const ramp = new Map<number, Lch>();
    project.palette.lightnessValues.forEach((lightness, i) => {
      const l = lightness / 100;
      ramp.set(STEPS[i] as number, {
        l,
        c: fitChroma(l, seed.c, seed.h),
        h: seed.h,
      });
    });
    for (const [weight, hex] of Object.entries(overrides)) {
      ramp.set(Number(weight), hexToOklch(hex));
    }
    lines.push(`/* ${track.id}: seed ${track.seedHex} */`);
    for (const weight of [...ramp.keys()].sort((a, b) => a - b)) {
      const { l, c, h } = ramp.get(weight) as Lch;
      const pinned = overrides[String(weight)];
      lines.push(
        `--${track.id}-${weight}: oklch(${num(l * 100, 2)}% ${num(c)} ${num(c < 1e-4 ? 0 : h, 2)});${pinned ? ` /* ${pinned} */` : ''}`,
      );
    }
    lines.push('');
  }

  const { baseUnitPx, density } = project.spacing;
  lines.push(
    '/* The spacing unit. Tailwind derives every spacing step from it. */',
  );
  lines.push(`--space-unit: ${rem(baseUnitPx * density)};`, '');

  lines.push(
    "/* Corners, in pixels times the blueprint's radius multiplier. */",
  );
  for (const token of project.radius.tokens) {
    const px = token.scales
      ? token.basePx * project.radius.multiplier
      : token.basePx;
    lines.push(`--corner-${token.id}: ${px >= 9999 ? '9999px' : rem(px)};`);
  }
  lines.push('');

  lines.push("/* Families, in the blueprint's fallback order. */");
  for (const font of system.fonts) {
    const name = FONT_FAMILY_NAMES[font.id];
    if (!name) throw new Error(`font ${font.id} has no family name`);
    const stack = font.families.flatMap(
      (family) =>
        FONT_VARIABLES[family] ??
        (/^[a-z-]+$/.test(family) ? [family] : [`'${family}'`]),
    );
    lines.push(`--family-${name}: ${stack.join(', ')};`);
  }
  lines.push('');

  const sizes = new Set<number>();
  const leadings = new Set<number>();
  const trackings = new Set<number>();
  for (const device of DEVICES) {
    for (const v of Object.values(typeByDevice[device])) {
      sizes.add(v.size);
      leadings.add(v.leading);
      trackings.add(v.tracking);
    }
  }
  const ascending = (a: number, b: number) => a - b;
  lines.push(
    '/* Type values, named by their pixel value and written in rem. */',
  );
  for (const px of [...sizes].sort(ascending)) {
    lines.push(`--size-${pxName(px)}: ${rem(px)};`);
  }
  for (const px of [...leadings].sort(ascending)) {
    lines.push(`--leading-${pxName(px)}: ${rem(px)};`);
  }
  for (const px of [...trackings].sort(ascending)) {
    lines.push(`--tracking-${pxName(px)}: ${rem(px)};`);
  }
  for (const weight of [...new Set(system.roles.map((r) => r.fontWeight))].sort(
    ascending,
  )) {
    lines.push(`--weight-${weight}: ${weight};`);
  }

  return `${header('Layer 1 of 3 — primitives. Values only; a component never references one (`FE_03` R2).')}\n${block(':root', lines)}\n`;
}

// ---------------------------------------------------------------------------------------------
// semantic.css

function elevation(mode: Mode): string[] {
  const { trackId, weight } = project.elevation.colour;
  return project.elevation.levels.map((level) => {
    const layers = level.layers.map(
      (layer) =>
        `${rem(layer.offsetXPx)} ${rem(layer.offsetYPx)} ${rem(layer.blurPx)} ${rem(layer.spreadPx)} ${colourRef({ trackId, weight, alpha: layer.opacity[mode] })}`,
    );
    return `--elevation-${level.id}: ${layers.join(', ')};`;
  });
}

function layoutValue(entry: (typeof project.layout)[number], device: Device) {
  const value = entry.byDevice[device];
  if (entry.kind === 'radius') return `var(--corner-${value})`;
  const step = Number(value.replace('-', '.'));
  return step === 0 ? '0' : `calc(var(--space-unit) * ${num(step)})`;
}

function layoutName(entry: (typeof project.layout)[number]): string {
  return entry.kind === 'radius'
    ? `--shape-${entry.id.replace(/^radius-/, '')}`
    : `--${entry.id}`;
}

function typeLines(device: Device, previous?: Device): string[] {
  const lines: string[] = [];
  for (const role of system.roles) {
    const v = typeByDevice[device][role.id];
    const before = previous ? typeByDevice[previous][role.id] : undefined;
    if (!v) continue;
    if (!before || before.size !== v.size) {
      lines.push(`--type-${role.id}-size: var(--size-${pxName(v.size)});`);
    }
    if (!before || before.leading !== v.leading) {
      lines.push(
        `--type-${role.id}-leading: var(--leading-${pxName(v.leading)});`,
      );
    }
    if (!before || before.tracking !== v.tracking) {
      lines.push(
        `--type-${role.id}-tracking: var(--tracking-${pxName(v.tracking)});`,
      );
    }
    if (!before) {
      lines.push(`--type-${role.id}-weight: var(--weight-${role.fontWeight});`);
    }
  }
  return lines;
}

function semantic(): string {
  const light: string[] = ['/* Colour roles. */'];
  for (const role of project.semantics) {
    light.push(`--${cssName(role.id)}: ${colourRef(role.light)};`);
  }
  light.push('', "/* Elevation, tinted with the blueprint's shadow colour. */");
  light.push(...elevation('light'));

  light.push('', '/* Corners. */');
  for (const token of project.radius.tokens) {
    light.push(`--shape-${token.id}: var(--corner-${token.id});`);
  }

  light.push('', '/* Layout roles, at phone size. */');
  for (const entry of project.layout) {
    light.push(`${layoutName(entry)}: ${layoutValue(entry, 'phone')};`);
  }

  light.push('', '/* Type roles, at phone size. */');
  light.push(...typeLines('phone'));

  const responsive = DEVICES.slice(1).map((device, i) => {
    const previous = DEVICES[i] as Device;
    const lines = [
      ...project.layout
        .filter((e) => layoutValue(e, device) !== layoutValue(e, previous))
        .map((e) => `${layoutName(e)}: ${layoutValue(e, device)};`),
      ...typeLines(device, previous),
    ];
    return lines.length === 0
      ? ''
      : `\n@media ${DEVICE_MEDIA[device]} {\n${block(':root', lines, '  ')}\n}\n`;
  });

  const dark = project.semantics.map(
    (role) => `--${cssName(role.id)}: ${colourRef(role.dark)};`,
  );
  dark.push(...elevation('dark'));

  return `${header(
    "Layer 2 of 3 — semantic roles, the only layer a component may reference (`FE_03` R2). Dark mode is a second mode of these same names (`FE_03` R7), switched by `data-theme='dark'` on `<html>`.",
  )}\n${block(':root', light)}\n${responsive.join('')}\n${block(":root[data-theme='dark']", dark)}\n`;
}

// ---------------------------------------------------------------------------------------------
// theme.css

function theme(): string {
  const lines: string[] = ['--*: initial;', ''];
  for (const role of project.semantics) {
    lines.push(`--color-${cssName(role.id)}: var(--${cssName(role.id)});`);
  }
  lines.push('');
  for (const token of project.radius.tokens) {
    lines.push(`--radius-${token.id}: var(--shape-${token.id});`);
  }
  for (const entry of project.layout.filter((e) => e.kind === 'radius')) {
    const name = layoutName(entry).replace('--shape-', '');
    lines.push(`--radius-${name}: var(--shape-${name});`);
  }
  lines.push('');
  for (const level of project.elevation.levels) {
    lines.push(`--shadow-${level.id}: var(--elevation-${level.id});`);
  }
  lines.push('');
  lines.push('--animate-spin: spin var(--motion-spin);');
  lines.push('--animate-pulse: pulse var(--motion-pulse);');
  lines.push('');
  lines.push(
    '@keyframes spin {',
    '  to {',
    '    transform: rotate(360deg);',
    '  }',
    '}',
  );
  lines.push('');
  lines.push('@keyframes pulse {', '  50% {', '    opacity: 0.5;', '  }', '}');
  lines.push('');
  for (const name of Object.values(FONT_FAMILY_NAMES)) {
    lines.push(`--font-${name}: var(--family-${name});`);
  }
  lines.push('--font-mono: var(--family-mono);');
  lines.push('--default-font-family: var(--family-main);');
  lines.push('--default-mono-font-family: var(--family-mono);');
  lines.push('');
  lines.push('--spacing: var(--space-unit);');
  for (const entry of project.layout.filter((e) => e.kind === 'spacing')) {
    lines.push(`--spacing-${entry.id}: var(--${entry.id});`);
  }
  lines.push('');
  for (const role of system.roles) {
    const t = `--type-${role.id}`;
    lines.push(`--text-${role.id}: var(${t}-size);`);
    lines.push(`--text-${role.id}--line-height: var(${t}-leading);`);
    lines.push(`--text-${role.id}--letter-spacing: var(${t}-tracking);`);
    lines.push(`--text-${role.id}--font-weight: var(${t}-weight);`);
  }
  lines.push('');
  for (const weight of [...new Set(system.roles.map((r) => r.fontWeight))].sort(
    (a, b) => a - b,
  )) {
    const name = WEIGHT_NAMES[weight];
    if (!name) throw new Error(`weight ${weight} has no name`);
    lines.push(`--font-weight-${name}: var(--weight-${weight});`);
  }
  lines.push('');
  lines.push('--container-2xl: var(--measure-2xl);');
  lines.push('--container-5xl: var(--measure-5xl);');
  lines.push('');
  lines.push(
    '/* Literal: a media query cannot read a custom property. Mobile first (`FE_04` R7). */',
  );
  lines.push('--breakpoint-sm: 40rem;');
  lines.push('--breakpoint-md: 48rem;');
  lines.push('--breakpoint-lg: 64rem;');
  lines.push('--breakpoint-xl: 80rem;');
  lines.push('--breakpoint-2xl: 96rem;');

  return `${header(
    "Layer 3 of 3 — the Tailwind theme. `--*: initial` drops Tailwind's defaults, so every utility that exists is token-backed (`FE_04` R1); `inline` makes utilities resolve to `var(--…)`, so a theme mode repaints them without regenerating anything.",
  )}\n\n@theme inline {\n${lines.map((l) => (l ? `  ${l}` : '')).join('\n')}\n}\n`;
}

// ---------------------------------------------------------------------------------------------

const outputs: Record<string, string> = {
  'src/primitives.css': primitives(),
  'src/semantic.css': semantic(),
  'src/theme.css': theme(),
};

for (const [path, content] of Object.entries(outputs)) {
  writeFileSync(join(ROOT, path), content);
}

const format = spawnSync(
  'biome',
  ['format', '--write', ...Object.keys(outputs)],
  { cwd: ROOT, stdio: 'inherit' },
);
if (format.status !== 0) process.exit(format.status ?? 1);
