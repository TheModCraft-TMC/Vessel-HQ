import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';
import { Wand2 } from 'lucide-react';

import { Button } from '@/ui/components/buttons';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';
import { FormSection } from '@/ui/components/forms/FormSection';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import { EnvironmentSelector } from './EnvironmentSelector';
import {
  EnvironmentOptionValue,
  existingEnvironmentTypes,
  newEnvironmentTypes,
} from './environment-types';

export function EnvironmentTypeSelectView({
  onStart,
}: {
  onStart?: (types: EnvironmentOptionValue[]) => void;
} = {}) {
  const [types, setTypes] = useState<EnvironmentOptionValue[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <PageHeader
        title="Quick Setup"
        breadcrumbs={[{ label: 'Environment Wizard' }]}
        reload
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetTitle icon={Wand2} title="Environment Wizard" />
            <WidgetBody>
              <div className="form-horizontal">
                <FormSection title="Select your environment(s)">
                  <p className="text-muted small">
                    You can onboard different types of environments, select all
                    that apply.
                  </p>
                  <p className="control-label !mb-2">
                    Connect to existing environments
                  </p>
                  <EnvironmentSelector
                    value={types}
                    onChange={setTypes}
                    options={existingEnvironmentTypes}
                  />
                  <p className="control-label !mb-2">Set up new environments</p>
                  <EnvironmentSelector
                    value={types}
                    onChange={setTypes}
                    options={newEnvironmentTypes}
                    hiddenSpacingCount={
                      existingEnvironmentTypes.length -
                      newEnvironmentTypes.length
                    }
                  />
                </FormSection>
              </div>
              <Button
                disabled={types.length === 0}
                data-cy="start-wizard-button"
                onClick={() => startWizard()}
                className="!ml-0"
              >
                Start Wizard
              </Button>
            </WidgetBody>
          </Widget>
        </div>
      </div>
    </>
  );

  function startWizard() {
    if (types.length === 0) {
      return;
    }

    if (onStart) {
      onStart(types);
      return;
    }

    router.push(
      buildHref(
        '/environments/new',
        {
          envType: types,
        },
        pathname
      )
    );
  }
}
