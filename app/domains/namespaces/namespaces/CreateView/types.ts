import { Registry } from '@/domains/registries';
import type { IngressControllerClassMap } from '@/domains/clusters';

import {
  ResourceQuotaFormValues,
  ResourceQuotaPayload,
} from '../components/NamespaceForm/ResourceQuotaFormSection/types';

export type CreateNamespaceFormValues = {
  name: string;
  resourceQuota: ResourceQuotaFormValues;
  ingressClasses: IngressControllerClassMap[];
  registries: Registry[];
};

export type CreateNamespacePayload = {
  Name: string;
  Owner: string;
  ResourceQuota: ResourceQuotaPayload;
};

export type UpdateRegistryPayload = {
  Id: number;
  Namespaces: string[];
};
