export type PostcardStampIconProps = {
  /** Its size: set the height, as it is taller than it is wide. */
  className?: string;
};

/**
 * An empty postage stamp, its edge bitten by perforations. The icon set has only a rubber stamp, so
 * this one is drawn here until #43 generates the set: ADR 0070.
 */
export function PostcardStampIcon({ className }: PostcardStampIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 24"
      fill="currentColor"
      fillRule="evenodd"
      className={className}
    >
      <path d="M1 1H2.15a1.1 1.1 0 0 0 2.2 0H6.65a1.1 1.1 0 0 0 2.2 0H11.15a1.1 1.1 0 0 0 2.2 0H15.65a1.1 1.1 0 0 0 2.2 0H19V2.1a1.1 1.1 0 0 0 0 2.2V6.5a1.1 1.1 0 0 0 0 2.2V10.9a1.1 1.1 0 0 0 0 2.2V15.3a1.1 1.1 0 0 0 0 2.2V19.7a1.1 1.1 0 0 0 0 2.2V23H17.85a1.1 1.1 0 0 0 -2.2 0H13.35a1.1 1.1 0 0 0 -2.2 0H8.85a1.1 1.1 0 0 0 -2.2 0H4.35a1.1 1.1 0 0 0 -2.2 0H1V21.9a1.1 1.1 0 0 0 0 -2.2V17.5a1.1 1.1 0 0 0 0 -2.2V13.1a1.1 1.1 0 0 0 0 -2.2V8.7a1.1 1.1 0 0 0 0 -2.2V4.3a1.1 1.1 0 0 0 0 -2.2ZM4.5 4.5v15h11v-15Z" />
    </svg>
  );
}
