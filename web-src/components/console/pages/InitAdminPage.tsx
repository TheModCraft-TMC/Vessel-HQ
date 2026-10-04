'use client';

import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { userAdminInit } from '@api/sdk.gen';

import fullLogo from '@/assets/images/vessel-hq-logo.svg';
import darkLogo from '@/assets/images/vessel-hq-logo-dark.svg';
import { administratorExists, login } from '@/domains/auth';
import { getEnvironments } from '@/domains/environments';
import { PublicSettingsResponse } from '@/domains/settings/models/types';
import { usePublicSettings } from '@/domains/settings/queries';
import { getSettings } from '@/domains/settings/services/settings.service';
import axios from '@/portainer/services/axios/axios';
import { getAppState, initializeAppState } from '@/react/portainer/app-state';
import { SetupTokenTextTip } from '@/react/portainer/init/InitAdminView/SetupTokenTextTip';
import { getSystemStatus } from '@/react/portainer/system/useSystemStatus';
import { LoadingButton } from '@/ui/components/buttons';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { FileUploadField } from '@/ui/components/forms/FileUpload';
import { Input } from '@/ui/components/forms/Input';
import { Icon } from '@/ui/components/icons/Icon';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';

const REDIRECT_REASON_TIMEOUT = 'AdminInitTimeout';

type Settings = PublicSettingsResponse & { RequiresSetupToken?: boolean };

export function useInitAdminSetup() {
  const router = useRouter();
  const settings = usePublicSettings().data as Settings | undefined;
  const checkedAdministrator = useRef(false);
  const [activePanel, setActivePanel] = useState<'create' | 'restore'>(
    'create'
  );
  const setup = {
    requiredPasswordLength: settings?.RequiredPasswordLength || 12,
    requiresSetupToken: !!settings?.RequiresSetupToken,
  };

  useEffect(() => {
    if (checkedAdministrator.current) return;
    checkedAdministrator.current = true;

    administratorExists()
      .then((exists) => {
        if (exists) router.replace('/environments/new');
        return undefined;
      })
      .catch((error) =>
        notifyError(
          'Failure',
          error,
          'Unable to verify administrator account existence'
        )
      );
  }, [router]);

  return {
    activePanel,
    logo: getAppState().application.logo || settings?.LogoURL,
    setup,
    showCreate: () => setActivePanel('create'),
    showRestore: () => setActivePanel('restore'),
    finishCreate,
    finishRestore: () => router.replace('/login'),
  };

  async function finishCreate() {
    const environments = await getEnvironments({ limit: 1 });
    if (environments.value.length) {
      router.replace('/');
      return;
    }

    const currentSettings = await getSettings();
    router.replace(
      currentSettings.EnableEdgeComputeFeatures
        ? '/environments/new'
        : '/init/edge'
    );
  }
}

export function InstallationLogo({ logo }: { logo?: string }) {
  return (
    <div className="row">
      {logo ? (
        <img src={logo} className="simple-box-logo" alt="Vessel HQ" />
      ) : (
        <>
          <img
            src={fullLogo}
            className="simple-box-logo hidden th-highcontrast:!block th-dark:!block"
            alt="Vessel HQ"
          />
          <img
            src={darkLogo}
            className="simple-box-logo block th-highcontrast:hidden th-dark:hidden"
            alt="Vessel HQ"
          />
        </>
      )}
    </div>
  );
}

export function CreateAdministratorForm({
  setup,
  onComplete,
}: {
  setup: { requiredPasswordLength: number; requiresSetupToken: boolean };
  onComplete(): Promise<void>;
}) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [creating, setCreating] = useState(false);
  const passwordsMatch = !!password && password === confirmPassword;

  return (
    <form
      className="simple-box-form form-horizontal padding-top"
      onSubmit={submit}
    >
      <p className="small text-muted">
        Please create the initial administrator user.
      </p>
      <FormRow label="Username" htmlFor="username">
        <Input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="e.g. admin"
          autoComplete="username"
          data-cy="init-username"
        />
      </FormRow>
      <FormRow label="Password" htmlFor="init-password">
        <Input
          id="init-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={setup.requiredPasswordLength}
          autoComplete="new-password"
          data-cy="init-password"
        />
      </FormRow>
      <FormRow label="Confirm password" htmlFor="confirm-password">
        <div className="input-group">
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            data-cy="init-confirmPassword"
          />
          <span className="input-group-addon !rounded-r-[5px]">
            <Icon
              icon={passwordsMatch ? Check : X}
              mode={passwordsMatch ? 'success' : 'danger'}
            />
          </span>
        </div>
      </FormRow>
      {setup.requiresSetupToken && (
        <SetupTokenRow
          value={setupToken}
          onChange={setSetupToken}
          id="setup-token"
          dataCy="init-adminSetupToken"
        />
      )}
      <TextTip color="orange" className="mb-4">
        The password must be at least {setup.requiredPasswordLength} characters
        long.
      </TextTip>
      <LoadingButton
        type="submit"
        className="!ml-0"
        disabled={
          !username ||
          password.length < setup.requiredPasswordLength ||
          !passwordsMatch ||
          (setup.requiresSetupToken && !setupToken)
        }
        isLoading={creating}
        loadingText="Creating user..."
        data-cy="init-createAdminButton"
      >
        Create user
      </LoadingButton>
    </form>
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    try {
      await userAdminInit({
        body: { Username: username, Password: password },
        ...(setupToken && { headers: { 'X-Setup-Token': setupToken } }),
      });
      await login({ username, password });
      await initializeAppState();
      await onComplete();
    } catch (error) {
      if (!handleInitError(error)) {
        notifyError('Failure', error, 'Unable to create administrator user');
      }
    } finally {
      setCreating(false);
    }
  }
}

export function RestoreBackupForm({
  requiresSetupToken,
  onComplete,
}: {
  requiresSetupToken: boolean;
  onComplete(): void;
}) {
  const [backupFile, setBackupFile] = useState<File>();
  const [backupPassword, setBackupPassword] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [restoring, setRestoring] = useState(false);

  return (
    <form
      className="simple-box-form form-horizontal padding-top"
      onSubmit={submit}
    >
      <p className="small text-muted">
        Restore environments, stacks, applications, and users from a Vessel HQ
        backup file.
      </p>
      <FormRow label="Backup file" htmlFor="backup-file">
        <FileUploadField
          inputId="backup-file"
          value={backupFile}
          onChange={setBackupFile}
          accept=".gz,.encrypted,application/x-tar,application/x-gzip"
          required
          data-cy="init-selectBackupFileButton"
        />
      </FormRow>
      <FormRow label="Password" htmlFor="backup-password">
        <Input
          id="backup-password"
          type="password"
          value={backupPassword}
          onChange={(event) => setBackupPassword(event.target.value)}
          data-cy="init-backupPasswordInput"
        />
        <span className="small text-muted">
          Leave empty when the backup is not password protected.
        </span>
      </FormRow>
      {requiresSetupToken && (
        <SetupTokenRow
          value={setupToken}
          onChange={setSetupToken}
          id="restore-setup-token"
          dataCy="init-restoreSetupToken"
        />
      )}
      <p className="small text-muted">
        After the restore completes, log in with a user from the restored Vessel
        HQ instance.
      </p>
      <LoadingButton
        type="submit"
        className="!ml-0"
        disabled={!backupFile || (requiresSetupToken && !setupToken)}
        isLoading={restoring}
        loadingText="Restoring Vessel HQ..."
        data-cy="init-restorePortainerButton"
      >
        Restore Vessel HQ
      </LoadingButton>
    </form>
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!backupFile) return;
    setRestoring(true);
    try {
      await uploadBackup(backupFile, backupPassword, setupToken);
      await waitForRestart();
      notifySuccess('Success', 'The backup has successfully been restored');
      onComplete();
    } catch (error) {
      if (!handleInitError(error)) {
        notifyError('Failure', error, 'Unable to restore the backup');
      }
    } finally {
      setRestoring(false);
    }
  }
}

function SetupTokenRow({
  value,
  onChange,
  id,
  dataCy,
}: {
  value: string;
  onChange(value: string): void;
  id: string;
  dataCy: string;
}) {
  return (
    <FormRow label="Setup token" htmlFor={id}>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        data-cy={dataCy}
      />
      <SetupTokenTextTip />
    </FormRow>
  );
}

export function SetupPanel({
  title,
  open,
  onOpen,
  children,
  dataCy,
}: {
  title: string;
  open: boolean;
  onOpen(): void;
  children: ReactNode;
  dataCy?: string;
}) {
  return (
    <div className="panel panel-default">
      <div className="panel-body">
        <button
          type="button"
          className="vertical-center w-full border-0 bg-transparent p-0 text-left"
          onClick={onOpen}
          data-cy={dataCy}
          aria-expanded={open}
        >
          <Icon icon={open ? ChevronDown : ChevronRight} mode="primary" />
          <span className="form-section-title">{title}</span>
        </button>
        {open && children}
      </div>
    </div>
  );
}

function FormRow({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="form-group">
      <label htmlFor={htmlFor} className="col-sm-4 control-label text-left">
        {label}
      </label>
      <div className="col-sm-8">{children}</div>
    </div>
  );
}

async function uploadBackup(file: File, password: string, setupToken: string) {
  const body = new FormData();
  body.append('file', file);
  body.append('password', password);
  await axios.post('restore', body, {
    headers: setupToken ? { 'X-Setup-Token': setupToken } : undefined,
  });
}

function handleInitError(error: unknown) {
  const response = error as {
    status?: number;
    response?: { headers?: Record<string, string> };
  };
  if (response.status === 303) {
    if (
      response.response?.headers?.['redirect-reason'] ===
      REDIRECT_REASON_TIMEOUT
    ) {
      window.location.href = '/timeout.html';
    }
    return true;
  }
  if (response.status === 403) {
    notifyError(
      'Failure',
      error,
      'Setup token is missing or invalid. Find the current token in the Vessel HQ server logs.'
    );
    return true;
  }
  return false;
}

async function waitForRestart() {
  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    try {
      const status = await getSystemStatus();
      if (status.Version) return;
    } catch {
      // The server is expected to be unavailable while restarting.
    }
  }
  throw new Error('Timeout while waiting for Vessel HQ to restart');
}
