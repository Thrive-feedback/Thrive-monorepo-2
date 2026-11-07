import { Trash2Icon } from 'lucide-react';
import { useId } from 'react';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import type { MemberRole } from '@/lib/session/current-account.type';
import { RoleSelect } from './role-select';

export type InviteEmailRowProps = {
  label: string;
  value: string;
  role: MemberRole;
  errorMessage?: string;
  ref?: React.Ref<HTMLInputElement>;
  isRemovable: boolean;
  onChange: (value: string) => void;
  onRoleChange: (role: MemberRole) => void;
  onBlur: () => void;
  onRemove: () => void;
};

/**
 * One person per row: their address and the Role they join with. The list shares one visible
 * label, so each input is named by `label` instead, which keeps rows apart for a screen reader
 * and names the Role select and the Remove button after their row.
 */
export function InviteEmailRow({
  label,
  value,
  role,
  errorMessage,
  ref,
  isRemovable,
  onChange,
  onRoleChange,
  onBlur,
  onRemove,
}: InviteEmailRowProps) {
  const messageId = useId();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          ref={ref}
          type="email"
          autoComplete="off"
          placeholder="name@company.com"
          aria-label={label}
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={errorMessage ? messageId : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
        <RoleSelect
          label={`Role for ${label.toLowerCase()}`}
          value={role}
          onChange={onRoleChange}
        />
        {/* An outlined square as tall as the field beside it, so the row reads as one line of
            controls; the bin turns red on hover, saying what pressing it does. */}
        {isRemovable && (
          <Button
            variant="secondary"
            size="icon"
            aria-label={`Remove ${label.toLowerCase()}`}
            onClick={onRemove}
            className="size-11 shrink-0 rounded-input text-fg-secondary enabled:hover:text-status-error"
          >
            <Trash2Icon aria-hidden="true" className="size-4" />
          </Button>
        )}
      </div>
      {errorMessage && (
        <p id={messageId} className="text-caption text-status-error-active">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
