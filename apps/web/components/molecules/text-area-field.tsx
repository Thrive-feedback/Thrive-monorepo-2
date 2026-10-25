import { cva } from 'class-variance-authority';
import { useId } from 'react';
import { Label } from '@/components/atoms/label';
import { Skeleton } from '@/components/atoms/skeleton';
import { Textarea, type TextareaProps } from '@/components/atoms/textarea';
import { cn } from '@/lib/cn.util';
import { AutocompleteTextarea } from './autocomplete-textarea';
import type { AutocompleteTrigger } from './use-tag-autocomplete';

const messageLine = cva('mt-2 text-caption', {
  variants: {
    invalid: { true: 'text-status-error-fg', false: 'text-fg-secondary' },
  },
  defaultVariants: { invalid: false },
});

/** The field's label, or kept for a screen reader where what surrounds the box already says it. */
const fieldLabel = cva('', {
  variants: { hidden: { true: 'sr-only', false: 'mb-1 block' } },
});

export type TextAreaFieldProps = Omit<TextareaProps, 'id'> & {
  label: string;
  /** Keeps the label for a screen reader only, where what surrounds the box already says it. */
  hideLabel?: boolean;
  helperText?: string;
  errorMessage?: string;
  /**
   * Tags it completes as they are typed, with their suggestions shown above the box. Needs a
   * controlled `value`, which completing a tag changes through `onChange`.
   */
  triggers?: readonly AutocompleteTrigger[];
};

/**
 * A labelled multi-line input with one line of help underneath. An `errorMessage` takes that line's
 * place and marks it invalid, so the reason is read out with the field rather than
 * found by looking for the red border.
 *
 * The asterisk is hidden from screen readers because `required` already announces the field
 * as required; reading both says it twice.
 */
export function TextAreaField({
  label,
  hideLabel = false,
  helperText,
  errorMessage,
  required,
  triggers,
  className,
  ...rest
}: TextAreaFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = errorMessage ?? helperText;

  return (
    <div className={cn('flex flex-col', className)}>
      <Label htmlFor={id} className={fieldLabel({ hidden: hideLabel })}>
        {required && (
          <span aria-hidden="true" className="me-1 text-status-error-fg">
            *
          </span>
        )}
        {label}
      </Label>
      {triggers ? (
        <AutocompleteTextarea
          id={id}
          required={required}
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          {...rest}
          value={String(rest.value ?? '')}
          triggers={triggers}
        />
      ) : (
        <Textarea
          id={id}
          required={required}
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          {...rest}
        />
      )}
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

/** A `TextAreaField` still loading: its label, the empty box at its least height, and a line of help. */
export function TextAreaFieldSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="mb-1 w-1/2 text-subtitle-4" />
      <Skeleton shape="control" className="h-20 rounded-input" />
      <Skeleton className={cn(messageLine(), 'w-3/4')} />
    </div>
  );
}
