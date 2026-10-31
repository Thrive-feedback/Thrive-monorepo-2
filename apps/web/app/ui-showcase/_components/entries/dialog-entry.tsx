import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/dialog';
import { TextField } from '@/components/molecules/text-field';

export function DialogEntry() {
  return (
    <ShowcaseEntry
      name="Dialog"
      level="atom"
      origin="shadcn"
      source="components/atoms/dialog.tsx — Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose"
      summary="A focused task over the page, which waits until it is done or dismissed."
      useFor="A short decision or form that must finish before going on: confirming a removal, inviting a teammate."
      avoidFor="Anything long, or anything the person needs the page behind to do. Give it its own page."
      usage={`import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/atoms/dialog';

<Dialog>
  <DialogTrigger asChild><Button>Invite</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Invite a teammate</DialogTitle>
      <DialogDescription>They get an email with a link.</DialogDescription>
    </DialogHeader>
    …
    <DialogFooter>
      <DialogClose asChild><Button>Cancel</Button></DialogClose>
      <Button variant="primary">Send invite</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`}
      props={[
        {
          name: 'open / defaultOpen',
          type: 'boolean',
          description: 'On Dialog: open or closed, controlled or uncontrolled.',
        },
        {
          name: 'onOpenChange',
          type: '(open: boolean) => void',
          description: 'On Dialog: called when it opens or closes.',
        },
        {
          name: 'hasCloseButton',
          type: 'boolean',
          defaultValue: 'true',
          description: 'On DialogContent: the × in the corner.',
        },
        {
          name: 'overlayClassName',
          type: 'string',
          description:
            'On DialogContent: added to the scrim, for a dialog that shows the page differently.',
        },
        {
          name: 'asChild',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'On DialogTrigger and DialogClose: make your own control open or close it.',
        },
      ]}
      accessibility={[
        'Announced as a dialog named by its title and described by its description.',
        'Focus moves inside on open and cannot leave until it closes.',
        'Escape or a click on the dimmed page closes it, and focus returns to the trigger.',
        'Fades and grows in, unless the person asked for reduced motion.',
      ]}
    >
      <StateCell label="Confirm">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="danger">Remove member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Pepper Potts?</DialogTitle>
              <DialogDescription>
                She loses access to Stark Industries straight away. You can
                invite her again later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="danger">Remove</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </StateCell>
      <StateCell label="With a form">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="primary">Invite teammate</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a teammate</DialogTitle>
              <DialogDescription>
                They get an email with a link to join.
              </DialogDescription>
            </DialogHeader>
            <TextField
              label="Email"
              type="email"
              placeholder="name@company.com"
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button>Cancel</Button>
              </DialogClose>
              <Button variant="primary">Send invite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </StateCell>
      <StateCell label="No corner button">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Read the terms</Button>
          </DialogTrigger>
          <DialogContent hasCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Before you start</DialogTitle>
              <DialogDescription>
                Feedback you give is seen by the person it is about and by
                Workspace admins.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="primary">Got it</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function DialogPreview() {
  return <Button variant="primary">Open dialog</Button>;
}
