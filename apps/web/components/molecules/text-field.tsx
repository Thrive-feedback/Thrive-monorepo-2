import { cva } from 'class-variance-authority';
import { useId } from 'react';
import { Input, type InputProps } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { cn } from '@/lib/cn.util';

const messageLine = cva('text-caption', {
  variants: {
    invalid: { true: 'text-danger', false: 'text-foreground-muted' },
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
 */
export function TextField({
  label,
  helperText,
  errorMessage,
  required,
  className,
  ...rest
}: TextFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = errorMessage ?? helperText;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id} className="block">
        {required && (
          <span aria-hidden="true" className="me-1 text-danger">
            *
          </span>
        )}
        {label}
      </Label>
      <Input
        id={id}
        required={required}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...rest}
      />
      {message && (
        <p
          id={messageId}
          className={messageLine({ invalid: errorMessage !== undefined })}
        >
          {message}
        </p>
      )}
    </div>
  );
}
