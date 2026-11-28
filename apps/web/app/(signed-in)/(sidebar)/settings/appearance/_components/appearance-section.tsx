import { SettingRow } from '@/app/(signed-in)/(sidebar)/settings/_components/setting-row';
import { SettingsCard } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-card';
import { Skeleton } from '@/components/atoms/skeleton';
import { ThemePicker } from '@/components/molecules/theme-picker';
import { FeedbackStyleSwitch } from '@/components/organisms/feedback-style-switch';
import { FeedbackStyleExamples } from './feedback-style-examples';

/**
 * The colour mode and the style Feedback is written in, both kept in this browser rather than on
 * the account, the style with an example of each under it.
 */
export function AppearanceSection() {
  return (
    <SettingsCard>
      <ThemeRow>
        <ThemePicker />
      </ThemeRow>
      <div>
        <FeedbackStyleRow>
          <FeedbackStyleSwitch />
        </FeedbackStyleRow>
        <FeedbackStyleExamples />
      </div>
    </SettingsCard>
  );
}

/** `AppearanceSection` while the page is built: the row as it reads, with the picker in grey. */
export function AppearanceSectionSkeleton() {
  return (
    <SettingsCard>
      <ThemeRow>
        <Skeleton shape="control" className="h-9.5 w-64 rounded-button" />
      </ThemeRow>
      <div>
        <FeedbackStyleRow>
          <Skeleton shape="control" className="h-5 w-32 rounded-full" />
        </FeedbackStyleRow>
        {/* The two examples' room, frame and caption included, so the page does not move as they
        arrive. */}
        <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2">
          {['postcard', 'plain'].map((style) => (
            <div key={style} className="flex flex-col gap-2">
              <div className="rounded-container border-2 border-transparent p-2">
                <Skeleton
                  shape="card"
                  className="aspect-3/2 h-auto rounded-container"
                />
              </div>
              <Skeleton className="mx-auto w-16 text-body-3" />
            </div>
          ))}
        </div>
      </div>
    </SettingsCard>
  );
}

function ThemeRow({ children }: { children: React.ReactNode }) {
  return <SettingRow label="Theme">{children}</SettingRow>;
}

function FeedbackStyleRow({ children }: { children: React.ReactNode }) {
  return (
    <SettingRow
      label="Feedback style"
      description="How Feedback looks while you write it. You always read it as a postcard, and Kudos stays a card."
    >
      {children}
    </SettingRow>
  );
}
