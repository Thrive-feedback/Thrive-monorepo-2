'use client';

import { useEffect, useId, useState, useTransition } from 'react';
import type { OfferedChannel } from '@/app/(signed-in)/(member)/settings/workspace/_lib/connection.type';
import { chooseChannel } from '@/app/(signed-in)/(member)/settings/workspace/_lib/integration-actions.service';
import { Button } from '@/components/atoms/button';
import { Label } from '@/components/atoms/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import { Text } from '@/components/atoms/text';

export type ChooseChannelFormProps = {
  /** The chat tool, by the segment that names it in a URL. */
  segment: string;
  /** What the tool is called on screen. */
  label: string;
  /** The tool's own name for the space authorised — a Discord server, a Slack team. */
  spaceName: string;
  /** The channels the tool offered. Text channels only; voice channels and categories are not here. */
  channels: readonly OfferedChannel[];
  /** Thrive's signed statement of which space was authorised, carried back with the choice. */
  installation: string;
  /** This page's own address, without the values the tool put in it. */
  cleanAddress: string;
};

/**
 * The last step of connecting a chat tool: which channel this Workspace posts in. Saving it
 * posts one message into that channel, and nothing is connected unless that message arrives —
 * so a refusal here leaves the Workspace exactly as it was, and says so.
 *
 * The address is cleaned as soon as this renders, because the tool put a single-use code in it
 * and a code has no business sitting in browser history or in a pasted link.
 */
export function ChooseChannelForm({
  segment,
  label,
  spaceName,
  channels,
  installation,
  cleanAddress,
}: ChooseChannelFormProps) {
  const selectId = useId();
  const [chosen, setChosen] = useState(channels[0]?.id ?? '');
  const [refusal, setRefusal] = useState<string>();
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    // The one browser-only job on this screen: drop the code and state from the address bar
    // without navigating, so what is left is a page this Admin can safely reload or share.
    window.history.replaceState(null, '', cleanAddress);
  }, [cleanAddress]);

  function save() {
    startSaving(async () => {
      // Answers only on failure: a success lands back on Settings → Workspace.
      const result = await chooseChannel(segment, installation, chosen);
      setRefusal(result.message);
    });
  }

  if (channels.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <Text variant="body-2">
          {label} has no text channel Thrive can post in, so there is nothing to
          choose. Add one in {spaceName}, then connect again.
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Text variant="body-2">
        Thrive is in <strong>{spaceName}</strong>. Choose the channel it posts
        in: everyone who can read that channel will see who gave Feedback to
        whom and what it was about — never the Feedback itself.
      </Text>
      <div className="flex flex-col gap-2">
        <Label htmlFor={selectId}>Channel</Label>
        <Select
          value={chosen}
          onValueChange={setChosen}
          disabled={isSaving}
          name="channelId"
        >
          <SelectTrigger id={selectId} className="w-full max-w-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {channels.map((channel) => (
              <SelectItem key={channel.id} value={channel.id}>
                #{channel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {refusal && (
        <Text variant="body-3" className="text-status-error" role="alert">
          {refusal}
        </Text>
      )}
      <div>
        <Button variant="primary" disabled={isSaving} onClick={save}>
          {isSaving ? 'Connecting…' : 'Connect this channel'}
        </Button>
      </div>
    </div>
  );
}
