import { Service } from '@/providers/infrastructure/docker';

import { ServiceUpdateConfig } from '../types';

export function convertServiceToConfig(service: Service): ServiceUpdateConfig {
  return {
    ...service.Spec,
    Name: service.Spec?.Name || '',
    Labels: service.Spec?.Labels || {},
    TaskTemplate: service.Spec?.TaskTemplate || {},
    Mode: service.Spec?.Mode || {},
    UpdateConfig: service.Spec?.UpdateConfig || {},
    Networks: service.Spec?.Networks || [],
    EndpointSpec: service.Spec?.EndpointSpec || {},
  };
}
