'use client';

import { FormikHelpers } from 'formik';
import { useRouter } from 'next/navigation';

import {
  GroupForm,
  GroupFormValues,
} from '@/react/portainer/environments/environment-groups/components/GroupForm';
import { useCreateGroupMutation } from '@/react/portainer/environments/environment-groups/queries/useCreateGroupMutation';
import { notifySuccess } from '@/ui/components/toast/notifications';

import { Widget } from '@@/Widget';

const INITIAL_VALUES: GroupFormValues = {
  name: '',
  description: '',
  tagIds: [],
  associatedEnvironments: [],
};

export function EnvironmentGroupCreateContent() {
  const router = useRouter();
  const createGroup = useCreateGroupMutation();

  return (
    <div className="mx-4 pb-20">
        <Widget>
          <Widget.Body>
            <GroupForm
              initialValues={INITIAL_VALUES}
              onSubmit={handleSubmit}
              submitLabel="Create"
              submitLoadingLabel="Creating..."
            />
          </Widget.Body>
        </Widget>
      </div>
  );

  function handleSubmit(
    values: GroupFormValues,
    { resetForm }: FormikHelpers<GroupFormValues>
  ): Promise<void> {
    return new Promise((resolve) => {
      createGroup.mutate(values, {
        onSuccess: () => {
          resetForm();
          notifySuccess('Success', 'Group successfully created');
          router.push('/groups');
        },
        onSettled: () => resolve(),
      });
    });
  }
}
