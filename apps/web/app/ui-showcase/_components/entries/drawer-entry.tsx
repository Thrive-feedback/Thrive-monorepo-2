import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Button } from '@/components/atoms/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/atoms/drawer';

export function DrawerEntry() {
  return (
    <ShowcaseEntry
      name="Drawer"
      level="atom"
      origin="thrive"
      source="components/atoms/drawer.tsx — Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose"
      summary="A panel of choices from the edge of the screen: up from the bottom on a phone, in from the right from md. The page behind stays undimmed."
      useFor="Choosing something whose effect shows on the page behind as it is chosen: a postcard's picture."
      avoidFor="A decision that must be finished before going on. Use a Dialog."
      usage={`import {
  Drawer, DrawerContent, DrawerDescription,
  DrawerHeader, DrawerTitle, DrawerTrigger,
} from '@/components/atoms/drawer';

<Drawer>
  <DrawerTrigger asChild><Button>Templates</Button></DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Templates</DrawerTitle>
      <DrawerDescription>Choose the picture on the front.</DrawerDescription>
    </DrawerHeader>
    …
  </DrawerContent>
</Drawer>`}
      props={[
        {
          name: 'open / defaultOpen',
          type: 'boolean',
          description: 'On Drawer: open or closed, controlled or uncontrolled.',
        },
        {
          name: 'modal',
          type: 'boolean',
          defaultValue: 'true',
          description:
            'On Drawer: false leaves the page in reach while it is open. A press on the page closes it and still reaches the page.',
        },
        {
          name: 'onOpenChange',
          type: '(open: boolean) => void',
          description: 'On Drawer: called when it opens or closes.',
        },
        {
          name: 'asChild',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'On DrawerTrigger and DrawerClose: make your own control open or close it.',
        },
      ]}
      accessibility={[
        'Announced as a dialog named by its title and described by its description.',
        'Focus moves inside on open and cannot leave until it closes.',
        'Escape, the × or a press outside closes it, and focus returns to the trigger.',
        'Not modal, focus is not held and the page is not hidden; a press on the page closes it and still reaches the page.',
        'Rises into place, unless the person asked for reduced motion.',
      ]}
    >
      <StateCell label="Choices">
        <Drawer>
          <DrawerTrigger asChild>
            <Button>Open drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Templates</DrawerTitle>
              <DrawerDescription>
                Choose the picture on the front of your card.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerClose asChild>
              <Button variant="primary">Done</Button>
            </DrawerClose>
          </DrawerContent>
        </Drawer>
      </StateCell>
      <StateCell label="Not modal">
        <Drawer modal={false}>
          <DrawerTrigger asChild>
            <Button>Open beside the page</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Stamps</DrawerTitle>
              <DrawerDescription>
                The page stays in reach while this is open.
              </DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function DrawerPreview() {
  return <Button>Open drawer</Button>;
}
