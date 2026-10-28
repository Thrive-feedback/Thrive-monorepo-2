import { Text } from '@/components/atoms/text';
import { type GroupPerson, PeopleDialogButton } from './people-dialog-button';
import { PersonChip } from './person-chip';

/** What a card calls somebody who has not introduced themselves yet. */
const GIVER_WITH_NO_NAME = 'A teammate';
const RECEIVER_WITH_NO_NAME = 'a teammate';

export type GiverToReceiversProps = {
  giver: GroupPerson;
  /** Everyone it is for, in the order the Giver chose them — at least one. */
  receivers: readonly GroupPerson[];
  /** What was given, which words the dialog of several people uses. */
  kind: 'Feedback' | 'Kudos';
};

/** What the dialog of several people says about them, in the Giver's name. */
function describeGroup(
  giver: GroupPerson,
  kind: GiverToReceiversProps['kind'],
  withYou: boolean,
) {
  const giverName = giver.isYou ? 'You' : (giver.name ?? GIVER_WITH_NO_NAME);
  const them = withYou ? 'you and all of them' : 'all of them';
  return kind === 'Kudos'
    ? `${giverName} sent this Kudos to ${them}.`
    : `${giverName} gave this Feedback to ${them}. Each of ${withYou ? 'you' : 'them'} sees who else it was for.`;
}

/**
 * A card's opening line: "[face] Giver to [face] Receiver". Given to several, the Receivers
 * fold into one stack of faces that opens a dialog naming each of them, so the line stays one
 * line however many it was for. When the person reading is one of several, they come first, by
 * their own face, as "you": "to [face] you and [faces]".
 *
 * Never anonymous (`ADR-0022` in the brain): somebody with no name yet is "a teammate", and
 * somebody Deactivated is named in grey with "(inactive)".
 */
export function GiverToReceivers({
  giver,
  receivers,
  kind,
}: GiverToReceiversProps) {
  const you = receivers.find((receiver) => receiver.isYou);
  const others = receivers.filter((receiver) => !receiver.isYou);
  const [onlyOther] = others;

  return (
    // A `div`, not a `p`: the stack of faces is a block, which a paragraph may not hold.
    <Text
      as="div"
      variant="subtitle-4"
      className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1"
    >
      <PersonChip person={giver} unnamed={GIVER_WITH_NO_NAME} sentenceStart />
      <span className="text-fg-secondary">to</span>
      {you && <PersonChip person={you} unnamed={RECEIVER_WITH_NO_NAME} />}
      {you && others.length > 0 && (
        <span className="text-fg-secondary">and</span>
      )}
      {others.length === 1 && onlyOther ? (
        <PersonChip person={onlyOther} unnamed={RECEIVER_WITH_NO_NAME} />
      ) : others.length > 1 ? (
        <PeopleDialogButton
          people={others}
          unnamed={RECEIVER_WITH_NO_NAME}
          description={describeGroup(giver, kind, Boolean(you))}
          title={
            you
              ? `Also for ${others.length} people`
              : `For ${others.length} people`
          }
        />
      ) : null}
    </Text>
  );
}
