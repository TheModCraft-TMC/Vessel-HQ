import { FormEvent, useEffect, useState } from 'react';
import { Lock, Trash2, User as UserIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

import { useCurrentUser } from '@/react/hooks/useUser';
import { useUser } from '@/portainer/users/queries/useUser';
import { userQueryKeys } from '@/portainer/users/queries/queryKeys';
import { deleteUser, updateUser } from '@/portainer/users/user.service';
import { Role } from '@/portainer/users/types';
import { usePublicSettings } from '@/react/portainer/settings/queries';
import { AuthenticationMethod } from '@/react/portainer/settings/types';
import {
  notifyError,
  notifySuccess,
} from '@/portainer/services/notifications';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { Switch } from '@@/form-components/SwitchField/Switch';
import { Button, LoadingButton } from '@@/buttons';
import { PasswordCheckHint } from '@@/PasswordCheckHint';
import { confirm, confirmChangePassword, confirmDelete } from '@@/modals/confirm';
import { ModalType } from '@@/modals';
import { buildConfirmButton } from '@@/modals/utils';

export function UserView() {
  const {
    params: { id },
  } = useCurrentStateAndParams();
  const userId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser } = useCurrentUser();
  const userQuery = useUser(userId);
  const settingsQuery = usePublicSettings();
  const [username, setUsername] = useState('');
  const [administrator, setAdministrator] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (userQuery.data) {
      // Reset the editable draft when the routed user changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsername(userQuery.data.Username);
      setAdministrator(userQuery.data.Role === Role.Admin);
    }
  }, [userQuery.data]);

  const updateMutation = useMutation(
    (payload: Parameters<typeof updateUser>[1]) => updateUser(userId, payload),
    {
      onSuccess: () => queryClient.invalidateQueries(userQueryKeys.base()),
    }
  );
  const deleteMutation = useMutation(() => deleteUser(userId));

  if (!userQuery.data || !settingsQuery.data) {
    return null;
  }

  const user = userQuery.data;
  const requiredLength = settingsQuery.data.RequiredPasswordLength;
  const passwordValid =
    newPassword.length >= requiredLength && newPassword === confirmPassword;
  const detailsChanged =
    username !== user.Username || administrator !== (user.Role === Role.Admin);

  return (
    <>
      <PageHeader
        title="User details"
        breadcrumbs={[
          { label: 'Users', link: 'portainer.users' },
          user.Username,
        ]}
        reload
      />

      <div className="mx-4 space-y-4">
        <Widget>
          <Widget.Title icon={UserIcon} title="User details" />
          <Widget.Body>
            <form className="form-horizontal" onSubmit={handleUpdateUser}>
              <FormControl inputId="username-field" label="Username" required>
                <Input
                  id="username-field"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  data-cy="user-username-input"
                />
              </FormControl>

              {currentUser.Role === Role.Admin && (
                <FormControl
                  inputId="administrator"
                  label="Administrator"
                  tooltip="Administrators have access to Vessel HQ settings as well as full control over all defined environments and their resources."
                >
                  <Switch
                    id="administrator"
                    name="administrator"
                    checked={administrator}
                    onChange={setAdministrator}
                    data-cy="user-administrator-switch"
                  />
                </FormControl>
              )}

              <div className="form-group">
                <div className="col-sm-12 flex gap-2">
                  <LoadingButton
                    disabled={!detailsChanged || !username.trim()}
                    isLoading={updateMutation.isLoading}
                    loadingText="Saving..."
                    data-cy="user-save-button"
                  >
                    Save
                  </LoadingButton>
                  <Button
                    color="danger"
                    icon={Trash2}
                    disabled={user.Id === 1 || deleteMutation.isLoading}
                    onClick={handleDeleteUser}
                    data-cy="user-delete-button"
                  >
                    Delete this user
                  </Button>
                </div>
              </div>
            </form>
          </Widget.Body>
        </Widget>

        {settingsQuery.data.AuthenticationMethod ===
          AuthenticationMethod.Internal && (
          <Widget>
            <Widget.Title icon={Lock} title="Change user password" />
            <Widget.Body>
              <form
                className="form-horizontal"
                onSubmit={handleUpdatePassword}
              >
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
                    data-cy="user-new-password"
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
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    data-cy="user-confirm-password"
                  />
                </FormControl>
                <div className="form-group">
                  <div className="col-sm-2" />
                  <div className="col-sm-10">
                    <PasswordCheckHint passwordValid={passwordValid} />
                  </div>
                </div>
                <div className="form-group">
                  <div className="col-sm-12">
                    <LoadingButton
                      disabled={!passwordValid}
                      isLoading={updateMutation.isLoading}
                      loadingText="Updating password..."
                      data-cy="user-update-password"
                    >
                      Update password
                    </LoadingButton>
                  </div>
                </div>
              </form>
            </Widget.Body>
          </Widget>
        )}
      </div>
    </>
  );

  async function handleUpdateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detailsChanged || !username.trim()) {
      return;
    }

    if (
      username !== user.Username &&
      !(await confirm({
        title: 'Are you sure?',
        modalType: ModalType.Warn,
        message: `Are you sure you want to rename the user ${user.Username} to ${username}?`,
        confirmButton: buildConfirmButton('Update'),
      }))
    ) {
      return;
    }

    updateMutation.mutate(
      { username: username.trim(), role: administrator ? Role.Admin : Role.Standard },
      {
        onSuccess: () => notifySuccess('Success', 'User successfully updated'),
        onError: (error) =>
          notifyError('Failure', error, 'Unable to update user permissions'),
      }
    );
  }

  async function handleDeleteUser() {
    if (
      !(await confirmDelete(
        'Do you want to remove this user? This user will not be able to log in to Vessel HQ anymore.'
      ))
    ) {
      return;
    }

    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        notifySuccess('User successfully deleted', user.Username);
        router.stateService.go('portainer.users');
      },
      onError: (error) =>
        notifyError('Failure', error, 'Unable to remove user'),
    });
  }

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordValid) {
      return;
    }

    const isCurrentUser = currentUser.Id === user.Id;
    if (isCurrentUser && !(await confirmChangePassword())) {
      return;
    }

    updateMutation.mutate(
      { newPassword },
      {
        onSuccess: () => {
          notifySuccess('Success', 'Password successfully updated');
          if (isCurrentUser) {
            router.stateService.go('portainer.logout');
          } else {
            setNewPassword('');
            setConfirmPassword('');
          }
        },
        onError: (error) =>
          notifyError('Failure', error, 'Unable to update user password'),
      }
    );
  }
}
