import { useId } from 'react';
import { cn } from '@/lib/cn.util';

export type TextFieldProps = Omit<
  React.ComponentPropsWithRef<'input'>,
  'id'
> & {
  label: string;
  helperText?: string;
};

/**
 * The asterisk is hidden from screen readers because `required` already announces the field
 * as required; reading both says it twice.
 */
export function TextField({
  label,
  helperText,
  required,
  className,
  ...rest
}: TextFieldProps) {
  const id = useId();
  const helperId = `${id}-helper`;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="font-medium text-sm">
        {required && (
          <span aria-hidden="true" className="me-1 text-danger">
            *
          </span>
        )}
        {label}
      </label>
      <input
        id={id}
        type="text"
        required={required}
        aria-describedby={helperText ? helperId : undefined}
        className="rounded-control border border-line-strong bg-surface px-3 py-2.5 text-base placeholder:text-foreground-muted"
        {...rest}
      />
      {helperText && (
        <p id={helperId} className="text-foreground-muted text-xs">
          {helperText}
        </p>
      )}
    </div>
  );
}
