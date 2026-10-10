'use client';

import {
  CreateAdministratorForm,
  InstallationLogo,
  RestoreBackupForm,
  SetupPanel,
  useInitAdminSetup,
} from '@app/_components/pages/InitAdminPage';

export default function Page() {
  const setup = useInitAdminSetup();

  return (
    <div className="page-wrapper">
      <div className="simple-box container">
        <div className="col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1">
          <InstallationLogo logo={setup.logo} />
          <SetupPanel
            title="New Vessel HQ installation"
            open={setup.activePanel === 'create'}
            onOpen={setup.showCreate}
          >
            <CreateAdministratorForm
              setup={setup.setup}
              onComplete={setup.finishCreate}
            />
          </SetupPanel>
          <SetupPanel
            title="Restore Vessel HQ from backup"
            open={setup.activePanel === 'restore'}
            onOpen={setup.showRestore}
            dataCy="init-installPortainerFromBackup"
          >
            <RestoreBackupForm
              requiresSetupToken={setup.setup.requiresSetupToken}
              onComplete={setup.finishRestore}
            />
          </SetupPanel>
        </div>
      </div>
    </div>
  );
}
