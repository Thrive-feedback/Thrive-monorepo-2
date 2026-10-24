import { readLinkedAccounts } from '@/app/(signed-in)/(member)/settings/account/_lib/linked-accounts.service';
import { calendarDay } from '@/lib/calendar-day.util';
import { CHAT_PROVIDER_LIST } from '@/lib/chat/chat-providers.constant';
import { SettingRow } from '../../_components/setting-row';
import { LinkAccountButton } from './link-account-button';
import { UnlinkAccountButton } from './unlink-account-button';

/**
 * Said before linking, because linking **is** the switch — there are no preferences to find
 * afterwards, and somebody should know what they are turning on before they turn it on.
 */
const NOT_LINKED =
  'Not linked. Link it and Thrive will message you there when somebody asks you for Feedback, answers you, or writes Feedback to you.';

/**
 * Said after linking, because a link on its own is not enough: a chat tool only lets Thrive
 * message somebody it already shares a space with, so a Workspace that has connected nothing —
 * or that disconnects later — leaves this quietly doing nothing.
 */
const NEEDS_A_CONNECTION =
  'Your Workspace also has to have connected this chat tool for messages to reach you.';

/**
 * One row per chat tool a Member can link their own account in: either which account Thrive has
 * and since when, or that nothing is linked.
 *
 * It reads only the caller's own links — the API has no way to ask about anybody else — so no
 * Member, Admin included, can see another's here or anywhere. It reads its own data, so the
 * section renders around it.
 */
export async function LinkedAccountList() {
  const links = await readLinkedAccounts();
  const linkOf = new Map(links.map((link) => [link.provider, link]));

  return (
    <>
      {CHAT_PROVIDER_LIST.map(({ segment, value, label }) => {
        const link = linkOf.get(value);
        return (
          <SettingRow
            key={segment}
            label={label}
            description={
              link
                ? `Linked as ${link.externalUsername} · ${calendarDay(link.linkedAt)}. Thrive messages you here about Feedback. ${NEEDS_A_CONNECTION}`
                : NOT_LINKED
            }
          >
            <span className="flex flex-wrap items-center gap-2">
              <LinkAccountButton
                segment={segment}
                label={label}
                isLinked={Boolean(link)}
              />
              {link && (
                <UnlinkAccountButton
                  segment={segment}
                  label={label}
                  externalUsername={link.externalUsername}
                />
              )}
            </span>
          </SettingRow>
        );
      })}
    </>
  );
}
