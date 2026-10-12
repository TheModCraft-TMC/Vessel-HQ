'use client';

import { FormikHelpers } from 'formik';
import { useRouter } from 'next/navigation';
import { PageContent } from '@console/layout/PageContent';

import {
  GroupForm,
  GroupFormValues,
} from '@/core/environment-management/environment-groups/components/GroupForm';
import { useCreateGroupMutation } from '@/core/environment-management/environment-groups/queries/useCreateGroupMutation';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { Widget } from '@/ui/components/Widget';

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
    <PageContent className="pb-20">
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
    </PageContent>
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
