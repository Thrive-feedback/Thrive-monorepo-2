import { memo } from 'react';

/**
 * The front of the postcard: a picture framed by the card's own paper, as on a real postcard.
 * Until people can choose one, every card shows the same drawn landscape, coloured from the
 * theme so it sits with the paper in light and dark alike. It never changes, so it is drawn once.
 */
export const PostcardCover = memo(function PostcardCover() {
  return (
    <div className="absolute inset-4 overflow-hidden rounded-inner border border-border-muted md:inset-5">
      <svg
        viewBox="0 0 300 200"
        preserveAspectRatio="xMidYMid slice"
        className="size-full"
        role="img"
        aria-label="A sun rising over rolling green hills"
      >
        <rect width="300" height="200" className="fill-status-info-surface" />
        <rect
          y="96"
          width="300"
          height="104"
          className="fill-status-warning-surface"
        />
        <circle
          cx="206"
          cy="92"
          r="40"
          className="fill-status-warning-surface-hover"
        />
        <circle cx="206" cy="92" r="26" className="fill-status-warning" />
        <path
          d="M118 44c4-4 8-4 12 0 4-4 8-4 12 0M152 30c3-3 6-3 9 0 3-3 6-3 9 0"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          className="stroke-fg-secondary"
        />
        <path
          d="M0 120C40 98 84 96 128 110s92 6 132-8 40-2 40-2v100H0z"
          className="fill-status-success-surface-hover"
        />
        <path
          d="M0 146c46-24 96-26 146-10s100 10 154-12v76H0z"
          className="fill-status-success-border"
        />
        <path
          d="M0 172c60-20 120-18 176-4s88 8 124-4v36H0z"
          className="fill-status-success"
        />
        <path
          d="M164 200c-6-14 4-22 22-30s30-14 26-26"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          className="stroke-status-warning-surface"
        />
      </svg>
    </div>
  );
});
