'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Lock, Trash2, User as UserIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { AuthenticationMethod, usePublicSettings } from '@/domains/settings';
import {
  deleteUser,
  Role,
  updateUser,
  useUser,
  userQueryKeys,
} from '@/domains/users';
import { useCurrentUser } from '@/react/hooks/useUser';
import { Button, LoadingButton } from '@/ui/components/buttons';
import { ModalType } from '@/ui/components/dialog';
import {
  confirm,
  confirmChangePassword,
  confirmDelete,
} from '@/ui/components/dialog/confirm';
import { buildConfirmButton } from '@/ui/components/dialog/utils';
import { FormControl } from '@/ui/components/forms/FormControl';
import { Input } from '@/ui/components/forms/Input';
import { Switch } from '@/ui/components/forms/SwitchField/Switch';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout';

import { PasswordCheckHint } from '@@/PasswordCheckHint';
import { Widget } from '@@/Widget';

export function UserDetailsHeader({ userId }: { userId: number }) {
  const userQuery = useUser(userId);

  return (
    <PageHeader
      title="User details"
      breadcrumbs={[
        { label: 'Users', link: '/users' },
        userQuery.data?.Username || 'User',
      ]}
      reload
    />
  );
}

export function UserDetailsContent({ userId }: { userId: number }) {
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsername(userQuery.data.Username);
      setAdministrator(userQuery.data.Role === Role.Admin);
    }
  }, [userQuery.data]);

  const updateUserMutation = useMutation(
    (payload: Parameters<typeof updateUser>[1]) => updateUser(userId, payload),
    { onSuccess: () => queryClient.invalidateQueries(userQueryKeys.base()) }
  );
  const deleteUserMutation = useMutation(() => deleteUser(userId));

  if (!userQuery.data || !settingsQuery.data) return null;

  const user = userQuery.data;
  const detailsChanged =
    username !== user.Username || administrator !== (user.Role === Role.Admin);
  const passwordValid =
    newPassword.length >= settingsQuery.data.RequiredPasswordLength &&
    newPassword === confirmPassword;

  return (
    <div className="mx-4 space-y-4">
        <UserProfilePanel
          username={username}
          administrator={administrator}
          showAdministrator={currentUser.Role === Role.Admin}
          canSave={detailsChanged && Boolean(username.trim())}
          canDelete={user.Id !== 1}
          isSaving={updateUserMutation.isLoading}
          isDeleting={deleteUserMutation.isLoading}
          onUsernameChange={setUsername}
          onAdministratorChange={setAdministrator}
          onSave={handleUpdateUser}
          onDelete={handleDeleteUser}
        />
        {settingsQuery.data.AuthenticationMethod ===
          AuthenticationMethod.Internal && (
          <UserPasswordPanel
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            passwordValid={passwordValid}
            isSaving={updateUserMutation.isLoading}
            onNewPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onSubmit={handleUpdatePassword}
          />
        )}
      </div>
  );

  async function handleUpdateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detailsChanged || !username.trim()) return;
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

    updateUserMutation.mutate(
      {
        username: username.trim(),
        role: administrator ? Role.Admin : Role.Standard,
      },
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

    deleteUserMutation.mutate(undefined, {
      onSuccess: () => {
        notifySuccess('User successfully deleted', user.Username);
        router.push('/users');
      },
      onError: (error) =>
        notifyError('Failure', error, 'Unable to remove user'),
    });
  }

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordValid) return;

    const isCurrentUser = currentUser.Id === user.Id;
    if (isCurrentUser && !(await confirmChangePassword())) return;

    updateUserMutation.mutate(
      { newPassword },
      {
        onSuccess: () => {
          notifySuccess('Success', 'Password successfully updated');
          if (isCurrentUser) router.push('/login');
          else {
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

function UserProfilePanel({
  username,
  administrator,
  showAdministrator,
  canSave,
  canDelete,
  isSaving,
  isDeleting,
  onUsernameChange,
  onAdministratorChange,
  onSave,
  onDelete,
}: {
  username: string;
  administrator: boolean;
  showAdministrator: boolean;
  canSave: boolean;
  canDelete: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onUsernameChange(value: string): void;
  onAdministratorChange(value: boolean): void;
  onSave(event: FormEvent<HTMLFormElement>): void;
  onDelete(): void;
}) {
  return (
    <Widget>
      <Widget.Title icon={UserIcon} title="User details" />
      <Widget.Body>
        <form className="form-horizontal" onSubmit={onSave}>
          <FormControl inputId="username-field" label="Username" required>
            <Input
              id="username-field"
              value={username}
              onChange={(event) => onUsernameChange(event.target.value)}
              data-cy="user-username-input"
            />
          </FormControl>
          {showAdministrator && (
            <FormControl
              inputId="administrator"
              label="Administrator"
              tooltip="Administrators have access to Vessel HQ settings as well as full control over all defined environments and their resources."
            >
              <Switch
                id="administrator"
                name="administrator"
                checked={administrator}
                onChange={onAdministratorChange}
                data-cy="user-administrator-switch"
              />
            </FormControl>
          )}
          <div className="form-group">
            <div className="col-sm-12 flex gap-2">
              <LoadingButton
                disabled={!canSave}
                isLoading={isSaving}
                loadingText="Saving..."
                data-cy="user-save-button"
              >
                Save
              </LoadingButton>
              <Button
                color="danger"
                icon={Trash2}
                disabled={!canDelete || isDeleting}
                onClick={onDelete}
                data-cy="user-delete-button"
              >
                Delete this user
              </Button>
            </div>
          </div>
        </form>
      </Widget.Body>
    </Widget>
  );
}

function UserPasswordPanel({
  newPassword,
  confirmPassword,
  passwordValid,
  isSaving,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: {
  newPassword: string;
  confirmPassword: string;
  passwordValid: boolean;
  isSaving: boolean;
  onNewPasswordChange(value: string): void;
  onConfirmPasswordChange(value: string): void;
  onSubmit(event: FormEvent<HTMLFormElement>): void;
}) {
  return (
    <Widget>
      <Widget.Title icon={Lock} title="Change user password" />
      <Widget.Body>
        <form className="form-horizontal" onSubmit={onSubmit}>
          <FormControl inputId="new-password" label="New password" required>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => onNewPasswordChange(event.target.value)}
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
              onChange={(event) => onConfirmPasswordChange(event.target.value)}
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
                isLoading={isSaving}
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
  );
}
