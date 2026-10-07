'use client';

import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  checkInviteEmail,
  checkInviteEmails,
} from '@/app/(signed-in)/register/invite-teammates/_lib/invite-emails.util';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import { InviteEmailRow } from './invite-email-row';

type Row = { id: number; value: string; errorMessage?: string };

const STARTING_ROW_COUNT = 1;

/**
 * A row's address is checked when the person leaves it, and every row again on Send. Editing a
 * flagged row clears its flag until they leave it again, so it never nags mid-word.
 *
 * Send is disabled until a row holds an address, so there is always someone to invite. A
 * flagged row refuses the whole send rather than sending the rest, so nobody is told their
 * invites went out while some are still waiting to be fixed.
 *
 * The confirmation is a toast, raised just before leaving for Home: the Toaster is in the root
 * layout, so the toast outlives this route.
 */
export function InviteTeammatesForm() {
  const router = useRouter();
  const nextId = useRef(STARTING_ROW_COUNT);
  const inputs = useRef(new Map<number, HTMLInputElement>());
  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: STARTING_ROW_COUNT }, (_, id) => ({ id, value: '' })),
  );
  const [focusRowId, setFocusRowId] = useState<number | null>(null);

  const hasAnyEmail = rows.some((row) => row.value.trim() !== '');

  useEffect(() => {
    if (focusRowId !== null) {
      inputs.current.get(focusRowId)?.focus();
      setFocusRowId(null);
    }
  }, [focusRowId]);

  function handleRowChange(id: number, value: string) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { id, value } : row)),
    );
  }

  function handleRowBlur(id: number) {
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? { ...row, errorMessage: checkInviteEmail(row.value) }
          : row,
      ),
    );
  }

  function handleAddRow() {
    const id = nextId.current++;
    setRows((current) => [...current, { id, value: '' }]);
    setFocusRowId(id);
  }

  /** Focus goes to the row that slides into the removed one's place, or the one above it. */
  function handleRemoveRow(id: number) {
    const index = rows.findIndex((row) => row.id === id);
    const remaining = rows.filter((row) => row.id !== id);
    setRows(remaining);
    setFocusRowId(remaining[Math.min(index, remaining.length - 1)]?.id ?? null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const check = checkInviteEmails(rows.map((row) => row.value));
    if (!check.ok) {
      setRows(
        rows.map((row, index) => ({
          ...row,
          errorMessage: check.errors[index],
        })),
      );
      const firstFlagged = rows.find((_, index) => check.errors[index]);
      setFocusRowId(firstFlagged?.id ?? null);
      return;
    }
    // TODO(kritpavin, #73): send the Invitations. Nothing is sent or stored yet.
    toast.success('Invitations sent', {
      description: invitedCount(check.emails.length),
    });
    router.push(ROUTES.home);
  }

  function handleSkip() {
    router.push(ROUTES.home);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-3">
        <Text as="legend" variant="subtitle-4" className="mb-2">
          Email address
        </Text>
        {/* Scrolls past about five rows. The padding, offset by the negative margin, keeps a
            focused field's ring inside the area instead of clipped at its edge. */}
        <div className="-m-1 flex max-h-72 flex-col gap-3 overflow-y-auto p-1">
          {rows.map((row, index) => (
            <InviteEmailRow
              key={row.id}
              ref={(input) => {
                if (input) {
                  inputs.current.set(row.id, input);
                } else {
                  inputs.current.delete(row.id);
                }
              }}
              label={`Email address ${index + 1}`}
              value={row.value}
              errorMessage={row.errorMessage}
              isRemovable={rows.length > 1}
              onChange={(value) => handleRowChange(row.id, value)}
              onBlur={() => handleRowBlur(row.id)}
              onRemove={() => handleRemoveRow(row.id)}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={handleAddRow}
        >
          <PlusIcon aria-hidden="true" className="size-4" />
          Add another
        </Button>
      </fieldset>
      <Button
        type="submit"
        variant="primary"
        disabled={!hasAnyEmail}
        className="mt-2 w-full"
      >
        Send invites &amp; Done
      </Button>
      <Button variant="secondary" className="w-full" onClick={handleSkip}>
        Skip &amp; Done
      </Button>
    </form>
  );
}

/** A count, never the addresses: a toast is easily read over a shoulder. */
function invitedCount(count: number): string {
  return count === 1
    ? 'We invited 1 teammate.'
    : `We invited ${count} teammates.`;
}
