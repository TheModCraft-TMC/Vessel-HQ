import { humanize } from '@/portainer/filters/filters';
import { AgentHostInfo } from '@/react/docker/host/queries/useAgentHostInfo';

import { Widget } from '@@/Widget/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';
import { WidgetTitle } from '@@/Widget/WidgetTitle';


export function DevicesPanel({
  devices,
  isLoading,
  isError,
}: {
  devices?: AgentHostInfo['PCIDevices'];
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <HardwarePanel
      title="PCI Devices"
      headers={['Name', 'Vendor']}
      rows={devices?.map((device) => [device.Name, device.Vendor])}
      isLoading={isLoading}
      isError={isError}
      emptyMessage="No device available."
    />
  );
}

export function DisksPanel({
  disks,
  isLoading,
  isError,
}: {
  disks?: AgentHostInfo['PhysicalDisks'];
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <HardwarePanel
      title="Physical Disks"
      headers={['Vendor', 'Size']}
      rows={disks?.map((disk) => [disk.Vendor, humanize(disk.Size) || ''])}
      isLoading={isLoading}
      isError={isError}
      emptyMessage="No disks available."
    />
  );
}

function HardwarePanel({
  title,
  headers,
  rows,
  isLoading,
  isError,
  emptyMessage,
}: {
  title: string;
  headers: [string, string];
  rows?: Array<[string, string]>;
  isLoading: boolean;
  isError: boolean;
  emptyMessage: string;
}) {
  return (
    <div className="row">
      <div className="col-xs-12">
        <Widget>
          <WidgetTitle title={title} icon="code" />
          <WidgetBody className="no-padding">
            <table className="table">
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows?.map(([first, second], index) => (
                  <tr key={`${first}-${second}-${index}`}>
                    <td>{first}</td>
                    <td>{second}</td>
                  </tr>
                ))}
                {(isLoading || isError || rows?.length === 0) && (
                  <tr>
                    <td colSpan={2} className="text-muted text-center">
                      {isLoading
                        ? 'Loading...'
                        : isError
                          ? `Failed to load ${title.toLowerCase()}.`
                          : emptyMessage}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
