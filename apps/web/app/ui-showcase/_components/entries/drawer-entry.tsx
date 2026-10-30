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
      origin="shadcn"
      source="components/atoms/drawer.tsx — Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose"
      summary="A panel of choices from the edge of the screen, on shadcn's Base UI drawer (ADR 0066): a bottom sheet on a phone, swiped down to close, with a handle; a panel on the right from md, swiped right. The page behind stays undimmed."
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
          name: 'container',
          type: 'HTMLElement | RefObject<HTMLElement>',
          description:
            "On DrawerContent: where it is rendered; the end of the page if not given. Inside a Radix modal it must be that modal's content (ADR 0066).",
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
        'Escape, the ×, a swipe toward its edge or a press outside closes it, and focus returns to the trigger.',
        'Not modal, focus is not held and the page is not hidden; a press on the page closes it and still reaches the page.',
        'Slides in from its edge and back out, unless the person asked for reduced motion.',
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
              <DrawerTitle>Stickers</DrawerTitle>
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
