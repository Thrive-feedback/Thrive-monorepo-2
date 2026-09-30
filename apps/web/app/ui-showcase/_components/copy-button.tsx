'use client';

import { toast } from 'sonner';
import { Button } from '@/components/atoms/button';

export type CopyButtonProps = {
  text: string;
  label: string;
};

export function CopyButton({ text, label }: CopyButtonProps) {
  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to the clipboard');
    } catch {
      toast.error('The browser would not let this page copy');
    }
  }

  return (
    <Button size="sm" variant="ghost" onClick={handleClick} aria-label={label}>
      Copy
    </Button>
  );
}
