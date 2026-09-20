import { Widget } from '@@/Widget/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';
import { WidgetTitle } from '@@/Widget/WidgetTitle';
import { DetailsTable } from '@@/DetailsTable/DetailsTable';

export type EngineDetails = {
  releaseVersion?: string;
  apiVersion?: string;
  rootDirectory?: string;
  storageDriver?: string;
  loggingDriver?: string;
  volumePlugins?: string[];
  networkPlugins?: string[];
  engineLabels?: Array<{ key: string; value: string }>;
};

export function EngineDetailsPanel({ engine }: { engine: EngineDetails }) {
  return (
    <div className="row">
      <div className="col-xs-12">
        <Widget>
          <WidgetTitle title="Engine Details" icon="code" />
          <WidgetBody className="no-padding">
            <DetailsTable dataCy="engine-details" className="!mb-0">
              <tr>
                <td>Version</td>
                <td>
                  {engine.releaseVersion}{' '}
                  {engine.apiVersion && `(API: ${engine.apiVersion})`}
                </td>
              </tr>
              {engine.rootDirectory && (
                <tr>
                  <td>Root directory</td>
                  <td>{engine.rootDirectory}</td>
                </tr>
              )}
              {engine.storageDriver && (
                <tr>
                  <td>Storage Driver</td>
                  <td>{engine.storageDriver}</td>
                </tr>
              )}
              {engine.loggingDriver && (
                <tr>
                  <td>Logging Driver</td>
                  <td>{engine.loggingDriver}</td>
                </tr>
              )}
              <tr>
                <td>Volume Plugins</td>
                <td>{engine.volumePlugins?.join(', ')}</td>
              </tr>
              <tr>
                <td>Network Plugins</td>
                <td>{engine.networkPlugins?.join(', ')}</td>
              </tr>
              {!!engine.engineLabels?.length && (
                <tr>
                  <td>Engine Labels</td>
                  <td>
                    {engine.engineLabels
                      .map(({ key, value }) => `${key}=${value}`)
                      .join(', ')}
                  </td>
                </tr>
              )}
            </DetailsTable>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
