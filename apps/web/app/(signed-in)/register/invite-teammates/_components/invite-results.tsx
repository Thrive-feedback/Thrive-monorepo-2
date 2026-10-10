import { useEffect, useRef } from 'react';
import type { InviteResult } from '@/app/(signed-in)/register/invite-teammates/_lib/invite-teammates-state.type';
import { Button } from '@/components/atoms/button';
import type { TextProps } from '@/components/atoms/text';
import { Text } from '@/components/atoms/text';

export type InviteResultsProps = {
  results: readonly InviteResult[];
  onContinue: () => void;
};

/** How each outcome reads beside its address. */
const OUTCOME_TEXT: Readonly<Record<InviteResult['outcome'], string>> = {
  invited: 'Invitation sent',
  already_member: 'is already in this Workspace',
  already_invited: 'already has a pending Invitation',
  failed: "Couldn't send",
};

/**
 * How serious each outcome is, as the status colour it reads in: sent is success, already in is
 * only information, already invited means no new email went out, and failed is an error. The
 * words above carry the same meaning, so nothing depends on seeing the colour.
 */
const OUTCOME_TONE: Readonly<
  Record<InviteResult['outcome'], NonNullable<TextProps['tone']>>
> = {
  invited: 'success',
  already_member: 'info',
  already_invited: 'warning',
  failed: 'danger',
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
      <Text as="h3" variant="subtitle-4" ref={heading} tabIndex={-1}>
        Invitations
      </Text>
      <ul className="flex flex-col gap-2">
        {results.map((result) => (
          <li key={result.email} className="flex flex-col">
            <Text as="span" variant="body-2" className="break-all">
              {result.email}
            </Text>
            <Text
              as="span"
              variant="caption"
              tone={OUTCOME_TONE[result.outcome]}
            >
              {OUTCOME_TEXT[result.outcome]}
            </Text>
          </li>
        ))}
      </ul>
      <Button variant="primary" className="mt-2 w-full" onClick={onContinue}>
        Continue
      </Button>
    </div>
  );
}
