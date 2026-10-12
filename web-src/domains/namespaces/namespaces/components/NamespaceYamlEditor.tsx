import { useRouteParams } from '@console/routing/useRouteParams';

import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { InlineLoader } from '@/ui/components/feedback/InlineLoader';
import { YAMLInspector } from '@/domains/clusters';
import { Widget } from '@/ui/components/Widget/Widget';
import { WidgetBody } from '@/ui/components/Widget';

import { useNamespaceYAML } from '../queries/useNamespaceYAML';

export function NamespaceYAMLEditor() {
  const { id: namespace } = useRouteParams();
  const environmentId = useEnvironmentId();
  const { data: fullNamespaceYaml, isLoading: isNamespaceYAMLLoading } =
    useNamespaceYAML(environmentId, namespace);

  if (isNamespaceYAMLLoading) {
    return (
      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetBody>
              <InlineLoader>Loading namespace YAML...</InlineLoader>
            </WidgetBody>
          </Widget>
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetBody>
            <YAMLInspector
              identifier="namespace-yaml"
              data={fullNamespaceYaml || ''}
              hideMessage
              data-cy="namespace-yaml"
            />
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
