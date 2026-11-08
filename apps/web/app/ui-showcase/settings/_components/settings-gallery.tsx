import { SettingsCard } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-card';
import { LinkedAccountRow } from '@/app/(signed-in)/(sidebar)/settings/account/_components/linked-account-row';
import { InvitationRow } from '@/app/(signed-in)/(sidebar)/settings/teammates/_components/invitation-row';
import { ConnectionRow } from '@/app/(signed-in)/(sidebar)/settings/workspace/_components/connection-row';
import { GallerySection } from '@/app/ui-showcase/_components/gallery-section';
import { ShowcasePage } from '@/app/ui-showcase/_components/showcase-page';
import {
  SAMPLE_CONNECTION,
  SAMPLE_INVITATIONS,
  SAMPLE_LINK,
} from '@/app/ui-showcase/settings/_lib/settings-samples.constant';

const DISCORD = { segment: 'discord', label: 'Discord' } as const;

/**
 * Settings rows that need a link, a Connection or an Invitation to draw, on sample data, so their
 * states can be seen without connecting anything. Each is the real row inside the real card, at
 * about the width a Settings card has in the app.
 */
export function SettingsGallery() {
  return (
    <ShowcasePage
      title="Settings rows"
      description={
        <>
          The rows of Settings that depend on what is linked, connected or
          invited, in every state, on sample data. Information opens as it does
          in the app. Change, Unlink, Disconnect, Resend and Revoke call the
          real actions, which answer with an error here, since nobody is signed
          in.
        </>
      }
    >
      <GallerySection
        title="Linked Accounts"
        description="Settings → Account. Not linked offers the button; linked says so, with a menu for which account, changing it and unlinking it."
      >
        <div className="flex max-w-2xl flex-col gap-4">
          <SettingsCard
            title="Linked Accounts · not linked"
            description="Your own chat accounts, where Thrive sends you direct messages."
          >
            <LinkedAccountRow {...DISCORD} link={null} />
          </SettingsCard>
          <SettingsCard
            title="Linked Accounts · linked"
            description="Your own chat accounts, where Thrive sends you direct messages."
          >
            <LinkedAccountRow {...DISCORD} link={SAMPLE_LINK} />
          </SettingsCard>
        </div>
      </GallerySection>

      <GallerySection
        title="Connections"
        description="Settings → General. An Admin can connect, change and disconnect; a Member can only read where the Workspace posts."
      >
        <div className="flex max-w-2xl flex-col gap-4">
          <SettingsCard title="Connections · not connected, as an Admin">
            <ConnectionRow {...DISCORD} connection={null} mayManage />
          </SettingsCard>
          <SettingsCard title="Connections · connected, as an Admin">
            <ConnectionRow
              {...DISCORD}
              connection={SAMPLE_CONNECTION}
              mayManage
            />
          </SettingsCard>
          <SettingsCard title="Connections · connected, as a Member">
            <ConnectionRow
              {...DISCORD}
              connection={SAMPLE_CONNECTION}
              mayManage={false}
            />
          </SettingsCard>
        </div>
      </GallerySection>

      <GallerySection
        title="Invitations"
        description="Settings → Teammates, for an Admin. Each says its address and where it stands; the rest is under Information."
      >
        <div className="flex max-w-2xl flex-col gap-4">
          <SettingsCard
            title="Invitations"
            description="Sent and not yet accepted."
          >
            <ul aria-label="Invitations" className="flex flex-col">
              {SAMPLE_INVITATIONS.map((invitation) => (
                <InvitationRow
                  key={invitation.invitationId}
                  workspaceId="showcase"
                  invitation={invitation}
                />
              ))}
            </ul>
          </SettingsCard>
        </div>
      </GallerySection>
    </ShowcasePage>
  );
}
