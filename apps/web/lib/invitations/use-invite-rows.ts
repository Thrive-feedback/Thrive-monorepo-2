'use client';

import { useEffect, useRef, useState } from 'react';
import type { MemberRole } from '@/lib/session/current-account.type';
import {
  checkInviteEmail,
  checkInviteEmails,
  type Invitee,
} from './invite-emails.util';

/** One row of an invite form: an address being typed and the Role it is sent with. */
export type InviteRow = {
  readonly id: number;
  readonly value: string;
  readonly role: MemberRole;
  readonly errorMessage?: string;
};

/** A row to start again from, such as an address whose email could not go out. */
export type InviteRowSeed = {
  readonly email: string;
  readonly role: MemberRole;
  readonly errorMessage?: string;
};

/** Everyone invited joins as a Member unless the inviter picks Admin (brain `ADR-0033`). */
const DEFAULT_ROLE: MemberRole = 'MEMBER';

function emptyRow(id: number): InviteRow {
  return { id, value: '', role: DEFAULT_ROLE };
}

/**
 * The rows of a one-person-per-row invite form, shared by the register flow and Settings. A
 * row's address is checked when the person leaves it, and every row again on `check`. Editing a
 * flagged row clears its flag until they leave it again, so it never nags mid-word. Focus moves
 * to a row that was added, to the one that takes a removed row's place, and to the first row
 * `check` flags.
 */
export function useInviteRows() {
  const nextId = useRef(1);
  const inputs = useRef(new Map<number, HTMLInputElement>());
  const [rows, setRows] = useState<InviteRow[]>(() => [emptyRow(0)]);
  const [focusRowId, setFocusRowId] = useState<number | null>(null);

  useEffect(() => {
    if (focusRowId !== null) {
      inputs.current.get(focusRowId)?.focus();
      setFocusRowId(null);
    }
  }, [focusRowId]);

  function update(id: number, change: (row: InviteRow) => InviteRow) {
    setRows((current) =>
      current.map((row) => (row.id === id ? change(row) : row)),
    );
  }

  return {
    rows,
    hasAnyEmail: rows.some((row) => row.value.trim() !== ''),

    /** The input of row `id`, so focus can be moved to it. */
    inputRef(id: number) {
      return (input: HTMLInputElement | null) => {
        if (input) {
          inputs.current.set(id, input);
        } else {
          inputs.current.delete(id);
        }
      };
    },

    changeEmail(id: number, value: string) {
      update(id, (row) => ({ id, value, role: row.role }));
    },

    changeRole(id: number, role: MemberRole) {
      update(id, (row) => ({ ...row, role }));
    },

    leave(id: number) {
      update(id, (row) => ({
        ...row,
        errorMessage: checkInviteEmail(row.value),
      }));
    },

    add() {
      const id = nextId.current++;
      setRows((current) => [...current, emptyRow(id)]);
      setFocusRowId(id);
    },

    remove(id: number) {
      const index = rows.findIndex((row) => row.id === id);
      const remaining = rows.filter((row) => row.id !== id);
      setRows(remaining);
      setFocusRowId(
        remaining[Math.min(index, remaining.length - 1)]?.id ?? null,
      );
    },

    /**
     * Who to invite, or `null` when a row is not an address: then every flagged row says why and
     * the first one takes focus, and nothing should be sent.
     */
    check(): Invitee[] | null {
      const result = checkInviteEmails(rows);
      if (result.ok) {
        return result.invitations;
      }
      setRows(
        rows.map((row, index) => ({
          ...row,
          errorMessage: result.errors[index],
        })),
      );
      setFocusRowId(rows.find((_, index) => result.errors[index])?.id ?? null);
      return null;
    },

    /** Starts the rows again from `seeds`, or from one empty row when there are none. */
    replaceWith(seeds: readonly InviteRowSeed[]) {
      const next =
        seeds.length > 0
          ? seeds.map((seed) => ({
              id: nextId.current++,
              value: seed.email,
              role: seed.role,
              errorMessage: seed.errorMessage,
            }))
          : [emptyRow(nextId.current++)];
      setRows(next);
      setFocusRowId(next[0]?.id ?? null);
    },
  };
}
