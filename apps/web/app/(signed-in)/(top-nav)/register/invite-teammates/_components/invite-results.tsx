import { useEffect, useRef } from 'react';
import type { InviteResult } from '@/app/(signed-in)/(top-nav)/register/invite-teammates/_lib/invite-teammates-state.type';
import { Badge, type BadgeTone } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';

export type InviteResultsProps = {
  results: readonly InviteResult[];
  onContinue: () => void;
};

/** How each outcome reads in the badge under its address, standing on its own. */
const OUTCOME_TEXT: Readonly<Record<InviteResult['outcome'], string>> = {
  invited: 'Invitation sent',
  already_member: 'Already in this Workspace',
  already_invited: 'Invitation already pending',
  failed: "Couldn't send",
};

/**
 * How serious each outcome is, as the status badge every screen draws it with: sent is success,
 * already in is only information, already invited means no new email went out, and failed is an
 * error. A badge sets its words on the status's own surface, so they read at any size; the status
 * colour as bare text is too light to. The words carry the meaning, so nothing depends on the colour.
 */
const OUTCOME_TONES: Readonly<Record<InviteResult['outcome'], BadgeTone>> = {
  invited: 'success',
  already_member: 'info',
  already_invited: 'warning',
  failed: 'error',
};

/**
 * What happened to each address once every Invitation that could go out has gone. It replaces
 * the form in place, so focus moves to its heading and a screen reader hears the change.
 */
export function InviteResults({ results, onContinue }: InviteResultsProps) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Text as="h3" variant="subtitle-3" ref={heading} tabIndex={-1}>
        Invitations status
      </Text>
      <ul className="flex flex-col gap-2">
        {results.map((result) => (
          <li
            key={`${result.email}-${result.outcome}`}
            className="flex flex-col items-start gap-1"
          >
            <Text as="span" variant="body-1" className="break-all">
              {result.email}
            </Text>
            <Badge tone={OUTCOME_TONES[result.outcome]}>
              {OUTCOME_TEXT[result.outcome]}
            </Badge>
          </li>
        ))}
      </ul>
      <Button variant="primary" className="mt-2 w-full" onClick={onContinue}>
        Continue
      </Button>
    </div>
  );
}
