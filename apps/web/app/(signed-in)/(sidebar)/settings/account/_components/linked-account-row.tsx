import { SettingRow } from '@/app/(signed-in)/(sidebar)/settings/_components/setting-row';
import type { LinkedAccount } from '@/app/(signed-in)/(sidebar)/settings/account/_lib/linked-account.type';
import { StatusText } from '@/components/atoms/status-text';
import { LinkAccountButton } from './link-account-button';
import { LinkedAccountActions } from './linked-account-actions';

/**
 * What linking turns on, behind the ⓘ beside the tool's name, because linking **is** the switch —
 * there are no preferences to find afterwards. It also says what linking alone cannot do: a chat
 * tool only lets Thrive message somebody it already shares a space with, so a Workspace that has
 * connected nothing, or disconnects later, leaves a link quietly doing nothing.
 */
function whatLinkingDoes(tool: string): string {
  return `Get a direct message in ${tool} when someone asks you for Feedback, answers your request, or writes Feedback to you. Works once your Workspace has connected ${tool}.`;
}

export type LinkedAccountRowProps = {
  /** The chat tool, by the segment that names it in a URL. */
  segment: string;
  /** What the tool is called on screen. */
  label: string;
  /** The account linked in it, or `null` while nothing is. */
  link: LinkedAccount | null;
};

/**
 * One chat tool a Member can link their own account in, saying only where it stands: not linked,
 * with the button to link it, or linked, with a menu for which account it is, changing it and
 * unlinking it.
 */
export function LinkedAccountRow({
  segment,
  label,
  link,
}: LinkedAccountRowProps) {
  return (
    <SettingRow
      label={label}
      description={
        link ? <StatusText tone="success">Linked</StatusText> : 'Not linked'
      }
      info={whatLinkingDoes(label)}
    >
      {link ? (
        <LinkedAccountActions segment={segment} label={label} link={link} />
      ) : (
        <LinkAccountButton segment={segment} label={label} />
      )}
    </SettingRow>
  );
}
