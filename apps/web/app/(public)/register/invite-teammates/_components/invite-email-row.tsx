import { Trash2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';

export type InviteEmailRowProps = {
  label: string;
  removeLabel: string;
  value: string;
  errorMessage?: string;
  ref?: React.Ref<HTMLInputElement>;
  isRemovable: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  onRemove: () => void;
};

/**
 * One address per row. The list shares one visible label, so each input is named by `label`
 * instead, which keeps rows apart for a screen reader; `removeLabel` names the Remove button after
 * its row.
 */
export function InviteEmailRow({
  label,
  removeLabel,
  value,
  errorMessage,
  ref,
  isRemovable,
  onChange,
  onBlur,
  onRemove,
}: InviteEmailRowProps) {
  const t = useTranslations('InviteTeammates');
  const messageId = useId();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          ref={ref}
          type="email"
          autoComplete="off"
          placeholder={t('emailPlaceholder')}
          aria-label={label}
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={errorMessage ? messageId : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
        {isRemovable && (
          <Button
            variant="ghost-danger"
            size="icon"
            aria-label={removeLabel}
            onClick={onRemove}
          >
            <Trash2Icon aria-hidden="true" className="size-4" />
          </Button>
        )}
      </div>
      {errorMessage && (
        <p id={messageId} className="text-caption text-danger">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
