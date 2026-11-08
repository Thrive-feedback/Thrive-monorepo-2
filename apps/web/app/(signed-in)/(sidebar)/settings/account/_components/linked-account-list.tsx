import { readLinkedAccounts } from '@/app/(signed-in)/(sidebar)/settings/account/_lib/linked-accounts.service';
import { CHAT_PROVIDER_LIST } from '@/lib/chat/chat-providers.constant';
import { LinkedAccountRow } from './linked-account-row';

/**
 * One row per chat tool a Member can link their own account in.
 *
 * It reads only the caller's own links — the API has no way to ask about anybody else — so no
 * Member, Admin included, can see another's here or anywhere.
 */
export async function LinkedAccountList() {
  const links = await readLinkedAccounts();
  const linkOf = new Map(links.map((link) => [link.provider, link]));

  return (
    <>
      {CHAT_PROVIDER_LIST.map(({ segment, value, label }) => (
        <LinkedAccountRow
          key={segment}
          segment={segment}
          label={label}
          link={linkOf.get(value) ?? null}
        />
      ))}
    </>
  );
}
