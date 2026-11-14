import { useId, useState } from 'react';
import {
  COMPOSE_CHOICE_OUTLINES,
  type ComposeChoice,
} from '@/app/(signed-in)/(sidebar)/_lib/compose-choice.constant';
import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import { AvatarName } from '@/components/molecules/avatar-name';
import type { Teammate } from '@/lib/feedback/teammate.type';

/** The three things to write to a teammate, in the order the row offers them. */
const ROW_CHOICES = [
  'give',
  'ask',
  'kudos',
] as const satisfies readonly ComposeChoice[];

/** Each choice's word on the button, and its whole name, which holds the word. */
const ACTIONS: Readonly<
  Record<ComposeChoice, { word: string; name: (who: string) => string }>
> = {
  give: { word: 'Give', name: (who) => `Give ${who} feedback` },
  ask: { word: 'Ask', name: (who) => `Ask ${who} for feedback` },
  kudos: { word: 'Kudos', name: (who) => `Give ${who} kudos` },
};

export type TeammateRowProps = {
  teammate: Teammate;
  /** The row is the person's own: marked You, with nothing to write to themselves. */
  isYou?: boolean;
  /** A choice was pressed, for this teammate, from that button. */
  onChoose: (
    choice: ComposeChoice,
    teammate: Teammate,
    from: HTMLButtonElement,
  ) => void;
};

/**
 * One teammate: their face, name and email, then Give, Ask and Kudos, each in the colour of the card
 * it opens. On a phone the actions share the width under the person; from `md` they end the row.
 * The person's own row says You beside their name and offers nothing, since nobody writes to
 * themselves.
 */
export function TeammateRow({
  teammate,
  isYou = false,
  onChoose,
}: TeammateRowProps) {
  return (
    <li className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:gap-6">
      <AvatarName
        name={teammate.name}
        photoUrl={teammate.photoUrl}
        className="flex min-w-0 flex-1"
      >
        <div className="flex min-w-0 flex-col">
          <span className="flex min-w-0 items-center gap-2">
            <Text as="span" variant="subtitle-4" className="truncate">
              {teammate.name}
            </Text>
            {isYou && (
              <Badge size="sm" tone="outline">
                You
              </Badge>
            )}
          </span>
          {/* Until they introduce themselves their email is their name, so it is said once. */}
          {teammate.name !== teammate.email && (
            <Text
              as="span"
              variant="body-3"
              tone="muted"
              className="truncate"
              title={teammate.email}
            >
              {teammate.email}
            </Text>
          )}
        </div>
      </AvatarName>
      {!isYou && (
        <div className="grid shrink-0 grid-cols-3 gap-2 md:flex">
          {ROW_CHOICES.map((choice) => {
            const { word, name } = ACTIONS[choice];
            if (choice === 'kudos' && teammate.slug === null) {
              return (
                <UnavailableKudos
                  key={choice}
                  label={name(teammate.name)}
                  who={teammate.name}
                />
              );
            }
            return (
              <Button
                key={choice}
                variant={COMPOSE_CHOICE_OUTLINES[choice]}
                size="sm"
                aria-label={name(teammate.name)}
                onClick={(event) =>
                  onChoose(choice, teammate, event.currentTarget)
                }
              >
                {word}
              </Button>
            );
          })}
        </div>
      )}
    </li>
  );
}

type UnavailableKudosProps = {
  /** The button's whole name, as the available one would have it. */
  label: string;
  /** Who it would be for. */
  who: string;
};

/**
 * Kudos for somebody who cannot have one yet. A Kudos only reaches somebody @mentioned, and a mention
 * is written with a handle, which a teammate has from introducing themselves. Until then the button
 * stays in its place, greyed, so every row keeps its three actions where they are, and it says why:
 * pointed at or focused, as any tooltip does, and pressed, since a touch screen does neither and a
 * press is all it has. A press elsewhere or Escape puts the reason away, as for any tooltip.
 * Assistive technology reads the reason as the button's description whether it shows or not.
 */
function UnavailableKudos({ label, who }: UnavailableKudosProps) {
  const reasonId = useId();
  const [isReasonShown, setIsReasonShown] = useState(false);
  const reason = `Kudos reach ${who} once they’ve introduced themselves.`;

  return (
    <>
      <Tooltip open={isReasonShown} onOpenChange={setIsReasonShown}>
        <TooltipTrigger asChild>
          <Button
            variant={COMPOSE_CHOICE_OUTLINES.kudos}
            size="sm"
            aria-label={label}
            aria-disabled
            aria-describedby={reasonId}
            onClick={(event) => {
              // The trigger closes its tooltip on a press unless told not to; this press shows it.
              event.preventDefault();
              setIsReasonShown(true);
            }}
          >
            Kudos
          </Button>
        </TooltipTrigger>
        <TooltipContent>{reason}</TooltipContent>
      </Tooltip>
      <span id={reasonId} className="sr-only">
        {reason}
      </span>
    </>
  );
}
