import { Layout } from 'lucide-react';

import { SidebarItem } from '../SidebarItem';

interface Props {
  environmentId: number;
  platformPath: string;
  'data-cy'?: string;
}

export function DashboardLink({
  environmentId,
  platformPath,
  'data-cy': dataCy,
}: Props) {
  return (
    <SidebarItem
      to={`/:endpointId/${platformPath}/dashboard`}
      params={{ endpointId: environmentId }}
      icon={Layout}
      label="Dashboard"
      data-cy={dataCy}
    />
  );
}
