import { ListIcon } from 'lucide-react';

import { ServicesDatatable } from '@/domains/services';

import { useSwarmStackResources } from './useSwarmStackServices';

export function StackServicesDatatable({ name }: { name: string }) {
  const servicesQuery = useSwarmStackResources(name);
  const services = servicesQuery.data;

  return (
    <ServicesDatatable
      dataset={services}
      titleIcon={ListIcon}
      tableKey="stack-services"
    />
  );
}
