import { SettingRow } from '@/app/(signed-in)/(sidebar)/settings/_components/setting-row';
import { SettingsCard } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-card';
import { Skeleton } from '@/components/atoms/skeleton';
import { ThemePicker } from '@/components/molecules/theme-picker';

/** The colour mode, kept in this browser rather than on the account. */
export function AppearanceSection() {
  return (
    <SettingsCard>
      <ThemeRow>
        <ThemePicker />
      </ThemeRow>
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
    </SettingsCard>
  );
}

function ThemeRow({ children }: { children: React.ReactNode }) {
  return (
    <SettingRow
      label="Theme"
      description="System follows your device's light or dark setting. Your choice is saved in this browser."
    >
      {children}
    </SettingRow>
  );
}
