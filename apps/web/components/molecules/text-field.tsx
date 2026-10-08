import { cva } from 'class-variance-authority';
import { useId } from 'react';
import { Input, type InputProps } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { cn } from '@/lib/cn.util';

const labelLine = cva('mb-2 block', {
  variants: {
    size: { sm: 'text-input-label-xs', md: 'text-input-label-sm' },
    tone: {
      default: '',
      invalid: 'text-status-error-fg',
      disabled: 'text-fg-secondary',
    },
  },
  defaultVariants: { size: 'md', tone: 'default' },
});

const messageLine = cva('mt-1.5 text-input-helper', {
  variants: {
    invalid: { true: 'text-status-error-fg', false: 'text-fg-secondary' },
  },
  defaultVariants: { invalid: false },
});

export type TextFieldProps = Omit<InputProps, 'id'> & {
  label: string;
  helperText?: string;
  errorMessage?: string;
};

/**
 * A labelled input with one line of help underneath. An `errorMessage` takes that line's
 * place and marks the input invalid, so the reason is read out with the field rather than
 * found by looking for the red border.
 *
 * The asterisk is hidden from screen readers because `required` already announces the field
 * as required; reading both says it twice.
 *
 * The label sits before the input, so it cannot follow it with `peer-disabled`; its
 * disabled and invalid colours are set here from the same props the input gets.
 */
export function TextField({
  label,
  helperText,
  errorMessage,
  size,
  required,
  disabled,
  className,
  ...rest
}: TextFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = errorMessage ?? helperText;
  const invalid = errorMessage !== undefined;

  return (
    <div className={cn('flex flex-col', className)}>
      <Label
        htmlFor={id}
        className={labelLine({
          size,
          tone: disabled ? 'disabled' : invalid ? 'invalid' : 'default',
        })}
      >
        {required && (
          <span aria-hidden="true" className="me-1 text-status-error-fg">
            *
          </span>
        )}
        {label}
      </Label>
      <Input
        id={id}
        size={size}
        required={required}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={message ? messageId : undefined}
        {...rest}
      />
      {message && (
        <p id={messageId} className={messageLine({ invalid })}>
          {message}
        </p>
      )}
    </div>
  );
}
