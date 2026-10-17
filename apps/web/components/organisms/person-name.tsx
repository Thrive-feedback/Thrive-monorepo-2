export type PersonNameProps = {
  /** What to call them: their name, or the screen's word for someone with none yet. */
  name: string;
  /** Deactivated in this Workspace. */
  inactive?: boolean;
};

/**
 * A person's name as everyone in the Workspace sees it: in grey followed by "(inactive)" while
 * they are Deactivated there, and as it is otherwise. It renders inline, so it sits inside the
 * sentence that names them.
 */
export function PersonName({ name, inactive = false }: PersonNameProps) {
  if (!inactive) {
    return name;
  }
  return <span className="text-fg-secondary">{name} (inactive)</span>;
}
