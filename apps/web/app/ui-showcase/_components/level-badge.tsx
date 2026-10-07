export type AtomicLevel = 'atom' | 'molecule';

export type LevelBadgeProps = {
  level: AtomicLevel;
};

export function LevelBadge({ level }: LevelBadgeProps) {
  return level === 'atom' ? (
    <span className="rounded-full bg-action-secondary-surface px-2.5 py-0.5 font-medium text-caption">
      Atom
    </span>
  ) : (
    <span className="rounded-full bg-status-info-surface px-2.5 py-0.5 font-medium text-caption">
      Molecule
    </span>
  );
}
