import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';

import { notifySuccess } from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout';
import { useCreateEdgeGroupMutation } from '@/domains/edge/queries/edge-groups/useCreateEdgeGroupMutation';

import { Widget } from '@@/Widget';

import { EdgeGroupForm } from '../components/EdgeGroupForm/EdgeGroupForm';

export function CreateView() {
  const mutation = useCreateEdgeGroupMutation();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <PageHeader
        title="Create edge group"
        breadcrumbs={[
          { label: 'Edge groups', link: '/edge/groups' },
          'Add edge group',
        ]}
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Body>
              <EdgeGroupForm
                onSubmit={({ environmentIds, ...values }) => {
                  mutation.mutate(
                    {
                      endpoints: environmentIds,
                      ...values,
                    },
                    {
                      onSuccess: () => {
                        notifySuccess(
                          'Success',
                          'Edge group successfully created'
                        );
                        router.push(buildHref('..', {}, pathname));
                      },
                    }
                  );
                }}
                isLoading={mutation.isLoading}
              />
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </>
  );
}
