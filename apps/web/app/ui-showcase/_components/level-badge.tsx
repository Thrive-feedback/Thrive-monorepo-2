import { Badge } from '@/components/atoms/badge';

export type AtomicLevel = 'atom' | 'molecule' | 'organism';

export type LevelBadgeProps = {
  level: AtomicLevel;
};

const BADGES: Readonly<Record<AtomicLevel, React.ReactNode>> = {
  atom: <Badge tone="highlight">Atom</Badge>,
  molecule: <Badge tone="info">Molecule</Badge>,
  organism: <Badge tone="brand">Organism</Badge>,
};

export function LevelBadge({ level }: LevelBadgeProps) {
  return BADGES[level];
}
