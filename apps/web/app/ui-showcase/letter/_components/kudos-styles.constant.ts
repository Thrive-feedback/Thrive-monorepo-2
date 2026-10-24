/** The looks a Kudos card can take, in the order Style steps through them. */
export const KUDOS_STYLES = [
  { style: 'confetti', label: 'Confetti' },
  { style: 'sunburst', label: 'Sunburst' },
  { style: 'stripes', label: 'Stripes' },
] as const;

export type KudosStyle = (typeof KUDOS_STYLES)[number]['style'];
