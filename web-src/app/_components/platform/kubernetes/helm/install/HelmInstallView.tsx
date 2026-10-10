import { useState, useMemo } from 'react';

import { useNamespacesQuery } from '@/domains/namespaces';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';
import { FormControl } from '@/ui/components/forms/FormControl';
import { Input } from '@/ui/components/forms/Input';
import { PortainerSelect } from '@/ui/components/forms/PortainerSelect';
import { FormSection } from '@/ui/components/forms/FormSection';
import { K8sRegistryAccessNotice } from '@/domains/clusters';
import { HelmTemplates } from '@/domains/configuration/helm/HelmTemplates/HelmTemplates';

import { Widget, WidgetBody } from '@@/Widget';


export function HelmInstallView() {
  return <HelmInstallContent showHeader />;
}

export function HelmInstallContent({
  showHeader = false,
}: {
  showHeader?: boolean;
}) {
  const environmentId = useEnvironmentId();
  const [namespace, setNamespace] = useState('');
  const [name, setName] = useState('');

  const namespacesQuery = useNamespacesQuery(environmentId);
  const namespaces = useMemo(
    () =>
      Object.values(namespacesQuery.data ?? {}).map((ns) => ({
        label: ns.Name,
        value: ns.Name,
      })),
    [namespacesQuery.data]
  );

  const defaultNamespace =
    namespaces.find((ns) => ns.value === 'default')?.value ||
    namespaces[0]?.value ||
    '';

  // Set default namespace if not set
  if (!namespace && defaultNamespace) {
    setNamespace(defaultNamespace);
  }

  return (
    <>
      {showHeader && (
        <PageHeader title="Helm install" breadcrumbs="Helm install" reload />
      )}
      <div className="row">
        <div className="col-sm-12 form-horizontal">
          <Widget>
            <WidgetBody>
              <FormSection title="Deploy to">
                <FormControl label="Namespace" required>
                  <div className="mb-1">
                    <K8sRegistryAccessNotice
                      namespace={namespace}
                      environmentId={environmentId}
                    />
                  </div>
                  <PortainerSelect
                    value={namespace}
                    onChange={setNamespace}
                    options={namespaces}
                    data-cy="namespace-select"
                  />
                </FormControl>

                <FormControl label="Release name" required>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. my-app"
                    data-cy="k8sHelmInstall-nameInput"
                  />
                </FormControl>
              </FormSection>

              <HelmTemplates
                namespace={namespace}
                name={name}
                onSelectHelmChart={() => {}}
              />
            </WidgetBody>
          </Widget>
        </div>
      </div>
    </>
  );
}
