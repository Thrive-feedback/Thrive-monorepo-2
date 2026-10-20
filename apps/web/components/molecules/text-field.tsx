import { cva } from 'class-variance-authority';
import { useId } from 'react';
import { Input, type InputProps } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Skeleton } from '@/components/atoms/skeleton';
import { cn } from '@/lib/cn.util';
import { AutocompleteInput } from './autocomplete-input';
import type { AutocompleteTrigger } from './use-tag-autocomplete';

const labelLine = cva('mb-1 block', {
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
  /**
   * Tags it completes as they are typed, with their suggestions shown above the input. Needs a
   * controlled `value`, which completing a tag changes through `onChange`.
   */
  triggers?: readonly AutocompleteTrigger[];
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
  triggers,
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
      {triggers ? (
        <AutocompleteInput
          id={id}
          size={size}
          required={required}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={message ? messageId : undefined}
          {...rest}
          value={String(rest.value ?? '')}
          triggers={triggers}
        />
      ) : (
        <Input
          id={id}
          size={size}
          required={required}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={message ? messageId : undefined}
          {...rest}
        />
      )}
      {message && (
        <p id={messageId} className={messageLine({ invalid })}>
          {message}
        </p>
      )}
    </div>
  );
}

/** A `TextField` still loading: its label, the field, and a line of help under it. */
export function TextFieldSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className={cn(labelLine(), 'w-1/3')} />
      <Skeleton shape="control" className="h-11 rounded-input" />
      <Skeleton className={cn(messageLine(), 'w-2/3')} />
    </div>
  );
}
