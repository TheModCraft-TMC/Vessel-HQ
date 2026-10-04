import { useRouteParams } from '@console/console/routing/useRouteParams';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { PageHeader } from '@/ui/layouts/view-layout';

import { Widget } from '@@/Widget';

import { useCustomTemplate } from '../queries/useCustomTemplate';
import { useViewType } from '../useViewType';

import { EditForm } from './EditForm';

export function EditView() {
  const viewType = useViewType();
  const { id } = useRouteParams();
  const environmentId = useEnvironmentId(false);
  const templateQuery = useCustomTemplate(Number(id));

  if (!templateQuery.data) {
    return null;
  }

  const template = templateQuery.data;

  return (
    <div>
      <PageHeader
        title="Edit Custom template"
        breadcrumbs={[
          { label: 'Custom Templates', link: '..' },
          template.Title,
        ]}
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Body>
              <EditForm
                environmentId={environmentId}
                template={template}
                viewType={viewType}
              />
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </div>
  );
}
