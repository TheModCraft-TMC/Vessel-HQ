import { useRouter } from 'next/navigation';
import { FormikHelpers } from 'formik';

import { notifySuccess } from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

import { Widget } from '@@/Widget';

import { useCreateGroupMutation } from '../queries/useCreateGroupMutation';
import { GroupForm, GroupFormValues } from '../components/GroupForm';

export function CreateGroupView() {
  const router = useRouter();
  const createMutation = useCreateGroupMutation();

  const initialValues: GroupFormValues = {
    name: '',
    description: '',
    tagIds: [],
    associatedEnvironments: [],
  };

  return (
    <>
      <PageHeader
        title="Create group"
        breadcrumbs={[
          { label: 'Groups', link: '/groups' },
          { label: 'Create group' },
        ]}
      />

      <div className="mx-4 pb-20">
        <Widget>
          <Widget.Body>
            <GroupForm
              initialValues={initialValues}
              onSubmit={handleSubmit}
              submitLabel="Create"
              submitLoadingLabel="Creating..."
            />
          </Widget.Body>
        </Widget>
      </div>
    </>
  );

  function handleSubmit(
    values: GroupFormValues,
    { resetForm }: FormikHelpers<GroupFormValues>
  ): Promise<void> {
    return new Promise((resolve) => {
      createMutation.mutate(
        {
          name: values.name,
          description: values.description,
          tagIds: values.tagIds,
          associatedEnvironments: values.associatedEnvironments,
        },
        {
          onSuccess: () => {
            resetForm();
            notifySuccess('Success', 'Group successfully created');
            router.push('/groups');
          },
          onSettled: () => resolve(),
        }
      );
    });
  }
}
