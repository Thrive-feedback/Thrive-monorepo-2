import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Button } from '@/components/atoms/button';
import { ButtonGroup } from '@/components/atoms/button-group';

export function ButtonGroupEntry() {
  return (
    <ShowcaseEntry
      name="ButtonGroup"
      level="atom"
      origin="shadcn"
      source="components/atoms/button-group.tsx"
      summary="Buttons joined into one control, with the corners between them squared off."
      useFor="A small set of choices where one is current: a form's mode, a list's tab kept in the URL."
      avoidFor="Unrelated actions side by side (space the Buttons apart), or a choice in a form (RadioGroup)."
      usage={`import { Button } from '@/components/atoms/button';
import { ButtonGroup } from '@/components/atoms/button-group';

<ButtonGroup aria-label="Feedback form">
  <Button variant="highlight" size="sm" aria-pressed="true">Request feedback</Button>
  <Button size="sm" aria-pressed="false">Give feedback</Button>
</ButtonGroup>`}
      props={[
        {
          name: 'orientation',
          type: "'horizontal' | 'vertical'",
          defaultValue: "'horizontal'",
          description: 'In a row, or stacked.',
        },
        {
          name: 'aria-label',
          type: 'string',
          description: 'What the buttons choose between.',
        },
      ]}
      accessibility={[
        'Announced as a named group.',
        'Mark the current button with aria-pressed, or the current link with aria-current="page".',
        'Each button keeps its own focus ring, drawn above its neighbours.',
      ]}
    >
      <StateCell label="One chosen">
        <ButtonGroup aria-label="Feedback form">
          <Button variant="highlight" size="sm" aria-pressed="true">
            Request feedback
          </Button>
          <Button size="sm" aria-pressed="false">
            Give feedback
          </Button>
        </ButtonGroup>
      </StateCell>
      <StateCell label="Three, the middle chosen">
        <ButtonGroup aria-label="List">
          <Button size="sm" aria-pressed="false">
            Shared with me
          </Button>
          <Button variant="highlight" size="sm" aria-pressed="true">
            My requests
          </Button>
          <Button size="sm" aria-pressed="false">
            Waiting for me
          </Button>
        </ButtonGroup>
      </StateCell>
      <StateCell label="Vertical">
        <ButtonGroup aria-label="Steps" orientation="vertical">
          <Button size="sm">First</Button>
          <Button size="sm">Second</Button>
          <Button size="sm">Third</Button>
        </ButtonGroup>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function ButtonGroupPreview() {
  return (
    <ButtonGroup aria-label="Feedback form">
      <Button variant="highlight" size="sm">
        Request
      </Button>
      <Button size="sm">Give</Button>
    </ButtonGroup>
  );
}
