'use client';

import { useEffect } from 'react';

import { Settings } from '@/domains/settings/models/types';
import { useSettings } from '@/domains/settings/queries';
import { ApplicationSettingsPanel } from '@/domains/settings/views/SettingsView/ApplicationSettingsPanel';
import { BackupSettingsPanel } from '@/domains/settings/views/SettingsView/BackupSettingsView';
import { ExperimentalFeatures } from '@/domains/settings/views/SettingsView/ExperimentalFeatures';
import { HelmCertPanel } from '@/domains/settings/views/SettingsView/HelmCertPanel';
import { HiddenContainersPanel } from '@/domains/settings/views/SettingsView/HiddenContainersPanel/HiddenContainersPanel';
import { KubeSettingsPanel } from '@/domains/settings/views/SettingsView/KubeSettingsPanel';
import { SSLSettingsPanelWrapper } from '@/domains/settings/views/SettingsView/SSLSettingsPanel/SSLSettingsPanel';
import { updateApplicationState } from '@/react/portainer/app-state';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

export function SettingsContent() {
  const settingsQuery = useSettings();

  useEffect(() => {
    const section = window.location.hash.slice(1);
    if (settingsQuery.data && section) {
      document.getElementById(section)?.scrollIntoView();
    }
  }, [settingsQuery.data]);

  return (
    <div className="mx-4 space-y-4">
        {settingsQuery.data && (
          <CoreSettingsPanels settings={settingsQuery.data} />
        )}
        <HelmCertPanel />
        <SSLSettingsPanelWrapper />
        {isBE && <ExperimentalFeatures />}
        <HiddenContainersPanel />
        <BackupSettingsPanel />
      </div>
  );
}

function CoreSettingsPanels({ settings }: { settings: Settings }) {
  return (
    <>
      <ApplicationSettingsPanel
        settings={settings}
        onSuccess={(updatedSettings) =>
          updateApplicationState({
            logo: updatedSettings.LogoURL,
            snapshotInterval: updatedSettings.SnapshotInterval,
          })
        }
      />
      <KubeSettingsPanel settings={settings} />
    </>
  );
}
