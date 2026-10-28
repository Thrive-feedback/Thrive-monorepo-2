export type PersonNameProps = {
  /** What to call them: their name, or the screen's word for someone with none yet. */
  name: string;
  /** Deactivated in this Workspace. */
  inactive?: boolean;
  /** The signed-in person themself, who is named "you" rather than by name. */
  isYou?: boolean;
  /** Opens a sentence, so "you" is written "You". */
  sentenceStart?: boolean;
};

/**
 * A person's name as everyone in the Workspace sees it: in grey followed by "(inactive)" while
 * they are Deactivated there, and as it is otherwise. The person reading is "you" wherever they
 * appear. It renders inline, so it sits inside the sentence that names them.
 */
export function PersonName({
  name,
  inactive = false,
  isYou = false,
  sentenceStart = false,
}: PersonNameProps) {
  if (isYou) {
    return sentenceStart ? 'You' : 'you';
  }
  if (!inactive) {
    return name;
  }
  return <span className="text-fg-secondary">{name} (inactive)</span>;
}
