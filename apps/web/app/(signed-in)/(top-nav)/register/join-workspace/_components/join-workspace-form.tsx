'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { acceptInvitation } from '@/app/(signed-in)/(top-nav)/register/join-workspace/_lib/invitation-actions.service';
import type { InvitationChoice } from '@/app/(signed-in)/(top-nav)/register/join-workspace/_lib/invitation-choice.util';
import type {
  JoinWorkspaceRefusal,
  JoinWorkspaceState,
} from '@/app/(signed-in)/(top-nav)/register/join-workspace/_lib/join-workspace-state.type';
import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import { Button } from '@/components/atoms/button';
import { RadioGroup, RadioGroupItem } from '@/components/atoms/radio-group';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';

const REFUSALS: Readonly<Record<JoinWorkspaceRefusal, string>> = {
  noLongerPending:
    'That Invitation is no longer available. Choose another, or create a new Workspace.',
  failed: "We couldn't join that Workspace. Please try again.",
};

export type JoinWorkspaceFormProps = {
  choices: readonly InvitationChoice[];
};

/**
 * One Workspace can be chosen, because a person belongs to one for now. With a single
 * Invitation it starts chosen. Join stays disabled until something is chosen, and while
 * joining, so a second click cannot send it twice.
 */
export function JoinWorkspaceForm({ choices }: JoinWorkspaceFormProps) {
  const [chosen, setChosen] = useState(
    choices.length === 1 ? (choices[0]?.invitationId ?? '') : '',
  );
  const [state, formAction, isJoining] = useActionState<
    JoinWorkspaceState,
    FormData
  >(acceptInvitation, {});

  // After a refusal the list is read again, and the one chosen may have left it.
  const stillChosen = choices.some((c) => c.invitationId === chosen)
    ? chosen
    : '';

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <RadioGroup
        name="invitationId"
        value={stillChosen}
        onValueChange={setChosen}
        aria-label="Workspaces you were invited to"
      >
        {choices.map((choice) => {
          const itemId = `invitation-${choice.invitationId}`;
          const nameId = `${itemId}-name`;
          const detailId = `${itemId}-detail`;
          return (
            <label
              key={choice.invitationId}
              htmlFor={itemId}
              className="flex cursor-pointer items-center gap-3 rounded-inner border border-border-default bg-surface-base p-3 has-data-[state=checked]:border-action-primary has-data-[state=checked]:bg-action-primary-surface"
            >
              <RadioGroupItem
                id={itemId}
                value={choice.invitationId}
                aria-labelledby={nameId}
                aria-describedby={detailId}
              />
              <Avatar shape="rounded" aria-hidden="true">
                <AvatarFallback>{choice.initial}</AvatarFallback>
              </Avatar>
              <span className="flex min-w-0 flex-col">
                <Text
                  as="span"
                  id={nameId}
                  variant="subtitle-4"
                  className="break-words"
                >
                  {choice.workspaceName}
                </Text>
                <Text as="span" id={detailId} variant="body-3" tone="muted">
                  {choice.detail}
                </Text>
              </span>
            </label>
          );
        })}
      </RadioGroup>
      {state.refusal && (
        <Text role="alert" variant="body-2" tone="danger">
          {REFUSALS[state.refusal]}
        </Text>
      )}
      <Button
        type="submit"
        variant="primary"
        disabled={stillChosen === '' || isJoining}
        className="mt-2 w-full"
      >
        Join
      </Button>
      <Button asChild variant="ghost" className="w-full">
        <Link href={ROUTES.register.createWorkspace}>
          No, create a new Workspace
        </Link>
      </Button>
    </form>
  );
}
