'use client';

import { CreateHelmRepositoryForm } from '@/domains/users/account/helm-repositories/CreateHelmRepositoryView/CreateHelmRespositoriesForm';

import { Widget, WidgetBody } from '@@/Widget';

export function HelmRepositoryCreateContent() {
  return (
    <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetBody>
              <CreateHelmRepositoryForm />
            </WidgetBody>
          </Widget>
        </div>
      </div>
  );
}
