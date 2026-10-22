import { useRouteParams } from '@console/routing/useRouteParams';
import { Layers } from 'lucide-react';

import { WidgetTitle, WidgetBody, Widget } from '@/ui/components/Widget';

export function NamespaceDetailsWidget() {
  const { id: namespaceName } = useRouteParams();
  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget aria-label="Namespace details">
          <WidgetTitle icon={Layers} title="Namespace" />
          <WidgetBody>
            <table className="table">
              <tbody>
                <tr>
                  <th scope="row" className="font-normal">
                    Name
                  </th>
                  <td>{namespaceName}</td>
                </tr>
              </tbody>
            </table>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
