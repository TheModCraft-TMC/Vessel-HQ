import { useRouteParams } from '@console/console/routing/useRouteParams';
import { Layers } from 'lucide-react';

import { WidgetTitle, WidgetBody, Widget } from '@@/Widget';

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
                  <td>Name</td>
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
