import { useEffect } from 'react';

import { updateApplicationState } from '@/react/portainer/app-state';

import { PageHeader } from '@@/PageHeader';

import { useSettings } from '../queries';
import { Settings } from '../types';
import { isBE } from '../../feature-flags/feature-flags.service';

import { ApplicationSettingsPanel } from './ApplicationSettingsPanel';
import { BackupSettingsPanel } from './BackupSettingsView';
import { HelmCertPanel } from './HelmCertPanel';
import { HiddenContainersPanel } from './HiddenContainersPanel/HiddenContainersPanel';
import { KubeSettingsPanel } from './KubeSettingsPanel';
import { SSLSettingsPanelWrapper } from './SSLSettingsPanel/SSLSettingsPanel';
import { ExperimentalFeatures } from './ExperimentalFeatures';

export function SettingsView() {
  const settingsQuery = useSettings();

  useEffect(() => {
    if (settingsQuery.data) {
      const regEx = /#!.*#(.*)/;
      const match = window.location.hash.match(regEx);
      if (match && match[1]) {
        document.getElementById(match[1])?.scrollIntoView();
      }
    }
  }, [settingsQuery.data]);

  return (
    <>
      <PageHeader title="Settings" breadcrumbs="Settings" reload />

      <div className="mx-4 space-y-4">
        {settingsQuery.data && (
          <>
            <ApplicationSettingsPanel
              onSuccess={handleSuccess}
              settings={settingsQuery.data}
            />

            <KubeSettingsPanel settings={settingsQuery.data} />
          </>
        )}

        <HelmCertPanel />

        <SSLSettingsPanelWrapper />

        {isBE && <ExperimentalFeatures />}

        <HiddenContainersPanel />

        <BackupSettingsPanel />
      </div>
    </>
  );
}

function handleSuccess(settings: Settings) {
  updateApplicationState({
    logo: settings.LogoURL,
    snapshotInterval: settings.SnapshotInterval,
  });
}
