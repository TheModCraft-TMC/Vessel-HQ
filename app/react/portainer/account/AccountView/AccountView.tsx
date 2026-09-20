import { FormEvent, useEffect, useState } from 'react';
import { Lock, Palette } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@uirouter/react';

import { userUpdatePassword } from '@api/sdk.gen';

import { useCurrentUser } from '@/react/hooks/useUser';
import { useLoadCurrentUser } from '@/portainer/users/queries/useLoadCurrentUser';
import { AuthenticationMethod } from '@/react/portainer/settings/types';
import { usePublicSettings } from '@/react/portainer/settings/queries';
import {
  getSkippedPasswordChanges,
  resetPasswordChangeSkips,
  setPasswordChangeSkipped,
} from '@/react/portainer/app-state';
import {
  notifyError,
  notifySuccess,
} from '@/portainer/services/notifications';
import { ThemeSelector } from '@/react/components/PageHeader/UserMenuThemeSelector';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { Button, LoadingButton } from '@@/buttons';
import { PasswordCheckHint } from '@@/PasswordCheckHint';
import { Link } from '@@/Link';
import { confirmChangePassword } from '@@/modals/confirm';
import { openDialog } from '@@/modals/Dialog';
import { buildConfirmButton } from '@@/modals/utils';

import { ApplicationSettingsWidget } from './ApplicationSettings';
import { AccessTokensDatatable } from './AccessTokensDatatable';
import { HelmRepositoryDatatable } from './HelmRepositoryDatatable';

export function AccountView() {
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

  useEffect(() => {
    const unregister = router.transitionService.onBefore({}, (transition) => {
      if (!forceChangePassword) {
        return true;
      }

      const nextState = transition.to().name ?? '';
      if (
        nextState.startsWith('portainer.logout') ||
        nextState === 'portainer.settings.authentication'
      ) {
        return true;
      }

      void openDialog({
        message:
          'Please update your password to a stronger password to continue using Vessel HQ',
        buttons: [buildConfirmButton('OK')],
      });
      return false;
    });

    return () => unregister();
  }, [forceChangePassword, router.transitionService]);

  const updatePasswordMutation = useMutation(async () => {
    await userUpdatePassword({
      path: { id: user.Id },
      body: { Password: currentPassword, NewPassword: newPassword },
    });
  });

  const requiredLength = publicSettingsQuery.data?.RequiredPasswordLength ?? 12;
  const isPasswordValid = newPassword.length >= requiredLength;
  const canChangePassword =
    (publicSettingsQuery.data?.AuthenticationMethod ===
      AuthenticationMethod.Internal ||
      user.Id === 1) &&
    Boolean(currentPassword) &&
    isPasswordValid &&
    newPassword === confirmPassword;

  return (
    <>
      <PageHeader
        title="User settings"
        breadcrumbs="User settings"
        reload
      />

      <div className="mx-4 space-y-4">
        <Widget>
          <Widget.Title icon={Palette} title="Theme" />
          <Widget.Body>
            <ThemeSelector user={user} />
          </Widget.Body>
        </Widget>

        <Widget>
          <Widget.Title icon={Lock} title="Change user password" />
          <Widget.Body>
            <form className="form-horizontal" onSubmit={handlePasswordSubmit}>
              <FormControl
                inputId="current-password"
                label="Current password"
                required
              >
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  data-cy="account-current-password"
                />
              </FormControl>
              <FormControl
                inputId="new-password"
                label="New password"
                required
              >
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
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
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  data-cy="account-confirm-password"
                />
              </FormControl>
              <div className="form-group">
                <div className="col-sm-3 col-lg-2" />
                <div className="col-sm-9 col-lg-10">
                  <PasswordCheckHint
                    passwordValid={isPasswordValid}
                    forceChangePassword={forceChangePassword}
                  />
                </div>
              </div>
              <div className="form-group">
                <div className="col-sm-12 flex items-center gap-2">
                  <LoadingButton
                    disabled={!canChangePassword}
                    isLoading={updatePasswordMutation.isLoading}
                    loadingText="Updating password..."
                    data-cy="account-update-password"
                  >
                    Update password
                  </LoadingButton>
                  {forceChangePassword && skippedPasswordChanges(user.Id) < 2 && (
                    <Button
                      color="default"
                      onClick={handleSkipPasswordChange}
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
                    to="portainer.settings.authentication"
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

        <ApplicationSettingsWidget />
        <AccessTokensDatatable />
        <HelmRepositoryDatatable />
      </div>
    </>
  );

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canChangePassword || !(await confirmChangePassword())) {
      return;
    }

    updatePasswordMutation.mutate(undefined, {
      onSuccess: () => {
        resetPasswordChangeSkips(user.Id);
        setPasswordRequirementHandled(true);
        notifySuccess('Success', 'Password successfully updated');
        router.stateService.go('portainer.logout');
      },
      onError: (error) =>
        notifyError('Failure', error, 'Unable to update password'),
    });
  }

  function handleSkipPasswordChange() {
    setPasswordChangeSkipped(user.Id);
    setPasswordRequirementHandled(true);
    router.stateService.go('portainer.home');
  }
}

function skippedPasswordChanges(userId: number) {
  return getSkippedPasswordChanges(userId);
}
