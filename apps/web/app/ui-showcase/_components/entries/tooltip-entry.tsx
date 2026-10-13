import { CopyIcon, InfoIcon } from 'lucide-react';
import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Button } from '@/components/atoms/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';

export function TooltipEntry() {
  return (
    <ShowcaseEntry
      name="Tooltip"
      level="atom"
      origin="shadcn"
      source="components/atoms/tooltip.tsx — Tooltip, TooltipTrigger, TooltipContent"
      summary="A few words about a control, shown on hover or keyboard focus."
      useFor="Naming an icon-only button for sighted mouse users, or a short hint beside a label."
      avoidFor="Anything someone must read to finish a task, or anything with a link. Touch screens never show it."
      usage={`import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/atoms/tooltip';

<Tooltip>
  <TooltipTrigger asChild>
    <Button size="icon" variant="ghost" aria-label="Copy link">
      <CopyIcon aria-hidden="true" className="size-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Copy link</TooltipContent>
</Tooltip>`}
      props={[
        {
          name: 'delayDuration',
          type: 'number',
          defaultValue: '300',
          description: 'On Tooltip: milliseconds of hover before it shows.',
        },
        {
          name: 'side',
          type: "'top' | 'right' | 'bottom' | 'left'",
          defaultValue: "'top'",
          description:
            'On TooltipContent: which side of the trigger it sits on.',
        },
        {
          name: 'open / onOpenChange',
          type: 'boolean / (open: boolean) => void',
          description: 'On Tooltip: control it yourself.',
        },
      ]}
      accessibility={[
        'Opens on keyboard focus as well as hover, and closes on Escape.',
        'Describes its trigger, so it adds to the name rather than replacing it: an icon button still needs its own aria-label.',
      ]}
    >
      <StateCell label="Icon button">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" aria-label="Copy link">
              <CopyIcon aria-hidden="true" className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy link</TooltipContent>
        </Tooltip>
      </StateCell>
      <StateCell label="Sides">
        {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
          <Tooltip key={side}>
            <TooltipTrigger asChild>
              <Button size="sm">{side}</Button>
            </TooltipTrigger>
            <TooltipContent side={side}>On the {side}</TooltipContent>
          </Tooltip>
        ))}
      </StateCell>
      <StateCell label="Hint beside text">
        <span className="inline-flex items-center gap-1 text-body-2">
          Team size
          <Tooltip>
            <TooltipTrigger
              aria-label="About team size"
              className="cursor-help rounded-full text-fg-secondary"
            >
              <InfoIcon aria-hidden="true" className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Used to suggest how often to ask.</TooltipContent>
          </Tooltip>
        </span>
      </StateCell>
      <StateCell label="Shown">
        <Tooltip open>
          <TooltipTrigger asChild>
            <Button size="sm">Always open</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            A longer note wraps onto a second line when it needs to.
          </TooltipContent>
        </Tooltip>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function TooltipPreview() {
  return (
    <span className="rounded-container bg-action-neutral px-3 py-1.5 text-body-3 text-fg-on-neutral">
      Copy link
    </span>
  );
}
