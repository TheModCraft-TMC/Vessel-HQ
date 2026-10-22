import { Gauge } from 'lucide-react';

import { stripProtocol } from '@/shared/strings';
import { useTagsForEnvironment } from '@/domains/tags';
import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { useEnvironment } from '@/domains/environments';
import { Widget, WidgetTitle, WidgetBody } from '@/ui/components/Widget';

export function EnvironmentInfo() {
  const environmentId = useEnvironmentId();
  const { data: environmentData, ...environmentQuery } =
    useEnvironment(environmentId);
  const tagsQuery = useTagsForEnvironment(environmentId);
  const tagNames = tagsQuery.tags?.map((tag) => tag.Name).join(', ') || '-';

  return (
    <Widget>
      <WidgetTitle icon={Gauge} title="Environment info" />
      <WidgetBody loading={environmentQuery.isLoading}>
        {environmentQuery.isError && <div>Failed to load environment</div>}
        {environmentData && (
          <table className="table">
            <tbody>
              <tr>
                <th scope="row" className="border-none! font-normal">
                  Environment
                </th>
                <td
                  className="border-none!"
                  data-cy="dashboard-environmentName"
                >
                  {environmentData.Name}
                </td>
              </tr>
              <tr>
                <th scope="row" className="border-t! font-normal">
                  URL
                </th>
                <td className="border-t!" data-cy="dashboard-environmenturl">
                  {stripProtocol(environmentData.URL) || '-'}
                </td>
              </tr>
              <tr>
                <th scope="row" className="font-normal">
                  Tags
                </th>
                <td data-cy="dashboard-environmentTags">{tagNames}</td>
              </tr>
            </tbody>
          </table>
        )}
      </WidgetBody>
    </Widget>
  );
}
