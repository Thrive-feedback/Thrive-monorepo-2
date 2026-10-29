import { EyeIcon } from 'lucide-react';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';

export type ComposerLayoutProps = {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  /** Who it goes to: a `ComposerToRow`. */
  to: React.ReactNode;
  /** What is written: the message field, with its one line of help under it. */
  message: React.ReactNode;
  /** Who else can read it, at the start of the footer. */
  audience: React.ReactNode;
  /** Anything that belongs beside Send, such as how many characters are left. */
  meta?: React.ReactNode;
  /** The one primary action. */
  submit: React.ReactNode;
  /** A footer-level problem, such as nobody picked to share it with. */
  footerError?: string;
  /** The footer problem's element id, so the control it is about can point at it. */
  footerErrorId?: string;
  /** Why the API refused it, read out as it appears. */
  formError?: string;
};

/**
 * The shape every mode of the composer takes — asking for Feedback, giving it, giving Kudos — so
 * the three read as one tool: who it goes to, what is written, then a footer with who else reads
 * it on one side and Send on the other. A form supplies the parts and keeps its own behaviour.
 */
export function ComposerLayout({
  onSubmit,
  to,
  message,
  audience,
  meta,
  submit,
  footerError,
  footerErrorId,
  formError,
}: ComposerLayoutProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {to}
      {message}
      <div className="flex flex-col gap-2 border-border-subtle border-t pt-4">
        {/* Above the footer's controls, where a menu opening under them cannot cover it. */}
        {footerError && (
          <p id={footerErrorId} className="text-body-3 text-status-error-fg">
            {footerError}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">{audience}</div>
          <div className="ms-auto flex items-center gap-4">
            {meta}
            {submit}
          </div>
        </div>
        {formError && (
          <Text role="alert" variant="body-2" tone="danger">
            {formError}
          </Text>
        )}
      </div>
    </form>
  );
}

export type ComposerToRowProps = {
  /** The recipient control, or what stands in for one. Its own label is for a screen reader. */
  children: React.ReactNode;
};

/**
 * "To", then whoever it goes to, as an address line reads. The word is for the eye only: the
 * control beside it carries the full question for a screen reader. "To" sits on the middle of a
 * face in the stack of people beside it, so whatever fills the row lines up on the same centre.
 */
export function ComposerToRow({ children }: ComposerToRowProps) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="w-6 shrink-0 pt-1.5 text-body-2 text-fg-secondary"
      >
        To
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export type ComposerAudienceNoteProps = {
  /** Who reads it, as a sentence fragment: "Everyone in Acme". */
  children: React.ReactNode;
};

/** Who reads it, where nobody chooses: said in the place the choice sits on the other modes. */
export function ComposerAudienceNote({ children }: ComposerAudienceNoteProps) {
  return (
    <p className="flex items-center gap-1.5 text-button-sm text-fg-secondary">
      <EyeIcon aria-hidden="true" className="size-4 shrink-0" />
      {children}
    </p>
  );
}

/** Any mode of the composer still loading: the To row, the message box, and the footer. */
export function ComposerLayoutSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-6 text-body-2" />
        <Skeleton shape="control" className="h-8 flex-1 rounded-input" />
      </div>
      <Skeleton shape="control" className="h-20 rounded-input" />
      <div className="flex items-center justify-between border-border-subtle border-t pt-4">
        <Skeleton className="w-24 text-button-sm" />
        <Skeleton shape="control" className="h-10 w-32 rounded-button" />
      </div>
    </div>
  );
}
