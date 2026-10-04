'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Palette } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { userUpdatePassword } from '@api/sdk.gen';
import { useCanExit } from '@console/console/routing/useCanExit';

import { AuthenticationMethod, usePublicSettings } from '@/domains/settings';
import { useLoadCurrentUser } from '@/domains/users';
import { AccessTokensDatatable } from '@/domains/users/account/AccountView/AccessTokensDatatable';
import { ApplicationSettingsWidget } from '@/domains/users/account/AccountView/ApplicationSettings';
import { HelmRepositoryDatatable } from '@/domains/users/account/AccountView/HelmRepositoryDatatable';
import { useCurrentUser } from '@/react/hooks/useUser';
import {
  getSkippedPasswordChanges,
  resetPasswordChangeSkips,
  setPasswordChangeSkipped,
} from '@/react/portainer/app-state';
import { Button, LoadingButton } from '@/ui/components/buttons';
import { confirmChangePassword } from '@/ui/components/dialog/confirm';
import { openDialog } from '@/ui/components/dialog/Dialog';
import { buildConfirmButton } from '@/ui/components/dialog/utils';
import { FormControl } from '@/ui/components/forms/FormControl';
import { Input } from '@/ui/components/forms/Input';
import { Link } from '@/ui/components/links/Link';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import { ThemeSelector } from '@/ui/layouts/view-layout';

import { PasswordCheckHint } from '@@/PasswordCheckHint';
import { Widget } from '@@/Widget';

export function AccountContent() {
  const { user } = useCurrentUser();

  return (
    <div className="mx-4 space-y-4">
      <AccountThemePanel user={user} />
      <AccountPasswordPanel />
      <ApplicationSettingsWidget />
      <AccessTokensDatatable />
      <HelmRepositoryDatatable />
    </div>
  );
}

function AccountThemePanel({
  user,
}: {
  user: Parameters<typeof ThemeSelector>[0]['user'];
}) {
  return (
    <Widget>
      <Widget.Title icon={Palette} title="Theme" />
      <Widget.Body>
        <ThemeSelector user={user} />
      </Widget.Body>
    </Widget>
  );
}

function AccountPasswordPanel() {
  const { user } = useCurrentUser();
  const currentUserQuery = useLoadCurrentUser();
  const publicSettingsQuery = usePublicSettings();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordRequirementHandled, setPasswordRequirementHandled] =
    useState(false);
  const forceChangePassword =
    Boolean(currentUserQuery.data?.forceChangePassword) &&
    !passwordRequirementHandled;

  useCanExit((destination) => {
    if (!forceChangePassword) return true;

    const nextPath = destination?.pathname || '';
    if (nextPath === '/logout' || nextPath === '/settings/authentication') {
      return true;
    }

    void openDialog({
      message:
        'Please update your password to a stronger password to continue using Vessel HQ',
      buttons: [buildConfirmButton('OK')],
    });
    return false;
  });

  const updatePassword = useMutation(async () => {
    await userUpdatePassword({
      path: { id: user.Id },
      body: { Password: currentPassword, NewPassword: newPassword },
    });
  });
  const requiredLength = publicSettingsQuery.data?.RequiredPasswordLength ?? 12;
  const passwordValid = newPassword.length >= requiredLength;
  const canChangePassword =
    (publicSettingsQuery.data?.AuthenticationMethod ===
      AuthenticationMethod.Internal ||
      user.Id === 1) &&
    Boolean(currentPassword) &&
    passwordValid &&
    newPassword === confirmPassword;

  return (
    <Widget>
      <Widget.Title icon={Lock} title="Change user password" />
      <Widget.Body>
        <form className="form-horizontal" onSubmit={handleSubmit}>
          <PasswordFields
            currentPassword={currentPassword}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            onCurrentPasswordChange={setCurrentPassword}
            onNewPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
          />
          <div className="form-group">
            <div className="col-sm-3 col-lg-2" />
            <div className="col-sm-9 col-lg-10">
              <PasswordCheckHint
                passwordValid={passwordValid}
                forceChangePassword={forceChangePassword}
              />
            </div>
          </div>
          <div className="form-group">
            <div className="col-sm-12 flex items-center gap-2">
              <LoadingButton
                disabled={!canChangePassword}
                isLoading={updatePassword.isLoading}
                loadingText="Updating password..."
                data-cy="account-update-password"
              >
                Update password
              </LoadingButton>
              {forceChangePassword &&
                getSkippedPasswordChanges(user.Id) < 2 && (
                  <Button
                    color="default"
                    onClick={handleSkip}
                    data-cy="account-remind-password-later"
                  >
                    Remind me later
                  </Button>
                )}
            </div>
          </div>
          {user.Role === 1 && (
            <p className="text-muted">
              Minimum password length is configured in{' '}
              <Link
                to="/settings/authentication"
                data-cy="authentication-settings-link"
              >
                authentication settings
              </Link>
              .
            </p>
          )}
        </form>
      </Widget.Body>
    </Widget>
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canChangePassword || !(await confirmChangePassword())) return;

    updatePassword.mutate(undefined, {
      onSuccess: () => {
        resetPasswordChangeSkips(user.Id);
        setPasswordRequirementHandled(true);
        notifySuccess('Success', 'Password successfully updated');
        router.push('/logout');
      },
      onError: (error) =>
        notifyError('Failure', error, 'Unable to update password'),
    });
  }

  function handleSkip() {
    setPasswordChangeSkipped(user.Id);
    setPasswordRequirementHandled(true);
    router.push('/');
  }
}

function PasswordFields({
  currentPassword,
  newPassword,
  confirmPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
}: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  onCurrentPasswordChange(value: string): void;
  onNewPasswordChange(value: string): void;
  onConfirmPasswordChange(value: string): void;
}) {
  return (
    <>
      <FormControl inputId="current-password" label="Current password" required>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(event) => onCurrentPasswordChange(event.target.value)}
          autoComplete="current-password"
          data-cy="account-current-password"
        />
      </FormControl>
      <FormControl inputId="new-password" label="New password" required>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(event) => onNewPasswordChange(event.target.value)}
          autoComplete="new-password"
          data-cy="account-new-password"
        />
      </FormControl>
      <FormControl
        inputId="confirm-password"
        label="Confirm password"
        required
        errors={
          confirmPassword && newPassword !== confirmPassword
            ? 'Passwords do not match.'
            : undefined
        }
      >
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => onConfirmPasswordChange(event.target.value)}
          autoComplete="new-password"
          data-cy="account-confirm-password"
        />
      </FormControl>
    </>
  );
}
