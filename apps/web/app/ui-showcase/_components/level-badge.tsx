import { Badge } from '@/components/atoms/badge';

export type AtomicLevel = 'atom' | 'molecule';

export type LevelBadgeProps = {
  level: AtomicLevel;
};

export function LevelBadge({ level }: LevelBadgeProps) {
  return level === 'atom' ? (
    <Badge tone="highlight">Atom</Badge>
  ) : (
    <Badge tone="info">Molecule</Badge>
  );
}
