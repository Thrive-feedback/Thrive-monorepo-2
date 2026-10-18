'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import type { MemberRole } from '@/lib/session/current-account.type';
import { ROLE_NAMES } from '@/lib/session/role-names.constant';

export type RoleSelectProps = {
  /** Names the select for a screen reader, since it sits beside what it applies to. */
  label: string;
  value: MemberRole;
  disabled?: boolean;
  onChange: (role: MemberRole) => void;
};

/** A choice between the two Roles, Admin and Member, in the glossary's words. */
export function RoleSelect({
  label,
  value,
  disabled = false,
  onChange,
}: RoleSelectProps) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => onChange(next === 'ADMIN' ? 'ADMIN' : 'MEMBER')}
    >
      <SelectTrigger aria-label={label} className="w-32 shrink-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="MEMBER">{ROLE_NAMES.MEMBER}</SelectItem>
        <SelectItem value="ADMIN">{ROLE_NAMES.ADMIN}</SelectItem>
      </SelectContent>
    </Select>
  );
}
