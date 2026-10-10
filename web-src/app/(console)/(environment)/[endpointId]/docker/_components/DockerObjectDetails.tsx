import type { ReactNode } from 'react';
import type { Clipboard } from 'lucide-react';

import { isoDate } from '@/portainer/filters/filters';
import { TableContainer, TableTitle } from '@/ui/components/data-table';

import { DetailsTable } from '@@/DetailsTable';

export function DockerObjectDetails({
  icon,
  title,
  name,
  id,
  createdAt,
  updatedAt,
  labels,
  actions,
  dataCy,
}: {
  icon: typeof Clipboard;
  title: string;
  name: string;
  id: string;
  createdAt: string;
  updatedAt: string;
  labels: Record<string, string>;
  actions: ReactNode;
  dataCy: string;
}) {
  return (
    <TableContainer>
      <TableTitle label={title} icon={icon} />
      <DetailsTable dataCy={dataCy}>
        <DetailsTable.Row label="Name">{name}</DetailsTable.Row>
        <DetailsTable.Row label="ID">
          {id}
          {actions}
        </DetailsTable.Row>
        <DetailsTable.Row label="Created">
          {isoDate(createdAt)}
        </DetailsTable.Row>
        <DetailsTable.Row label="Last updated">
          {isoDate(updatedAt)}
        </DetailsTable.Row>
        {Object.keys(labels).length > 0 && (
          <DetailsTable.Row label="Labels">
            <LabelsTable labels={labels} />
          </DetailsTable.Row>
        )}
      </DetailsTable>
    </TableContainer>
  );
}

function LabelsTable({ labels }: { labels: Record<string, string> }) {
  return (
    <table className="table-bordered table-condensed table">
      <tbody>
        {Object.entries(labels).map(([key, value]) => (
          <tr key={key}>
            <td>{key}</td>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
