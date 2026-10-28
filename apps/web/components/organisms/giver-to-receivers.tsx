import { Text } from '@/components/atoms/text';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { type GroupPerson, PeopleDialogButton } from './people-dialog-button';
import { PersonName } from './person-name';

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

/** One person in the line: their face beside their name. */
function FaceAndName({
  person,
  unnamed,
}: {
  person: GroupPerson;
  unnamed: string;
}) {
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
      <PhotoAvatar
        name={person.name ?? ''}
        photoUrl={person.photoUrl}
        size="sm"
      />
      <span className="min-w-0 break-words">
        <PersonName name={person.name ?? unnamed} inactive={person.inactive} />
      </span>
    </span>
  );
}

/**
 * A card's opening line: "[face] Giver to [face] Receiver". Given to several, the Receivers
 * fold into one stack of faces that opens a dialog naming each of them, so the line stays one
 * line however many it was for. Never anonymous (`ADR-0022` in the brain): somebody with no name
 * yet is "a teammate", and somebody Deactivated is named in grey with "(inactive)".
 */
export function GiverToReceivers({
  giver,
  receivers,
  kind,
}: GiverToReceiversProps) {
  const [onlyReceiver] = receivers;
  const giverName = giver.name ?? GIVER_WITH_NO_NAME;
  const description =
    kind === 'Kudos'
      ? `${giverName} sent this Kudos to all of them.`
      : `${giverName} gave this Feedback to all of them. Each of them sees who else it was for.`;

  return (
    // A `div`, not a `p`: the stack of faces is a block, which a paragraph may not hold.
    <Text
      as="div"
      variant="subtitle-4"
      className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1"
    >
      <FaceAndName person={giver} unnamed={GIVER_WITH_NO_NAME} />
      <span className="text-fg-secondary">to</span>
      {receivers.length === 1 && onlyReceiver ? (
        <FaceAndName person={onlyReceiver} unnamed={RECEIVER_WITH_NO_NAME} />
      ) : (
        <PeopleDialogButton
          people={receivers}
          unnamed={RECEIVER_WITH_NO_NAME}
          description={description}
        />
      )}
    </Text>
  );
}
