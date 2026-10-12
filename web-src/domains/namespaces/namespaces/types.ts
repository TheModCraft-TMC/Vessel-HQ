import { Registry } from '@/domains/registries';
import type { KubernetesNamespace } from '@/providers/infrastructure/kubernetes';
import type { IngressControllerClassMap } from '@/domains/clusters';

import { ResourceQuotaFormValues } from './components/NamespaceForm/ResourceQuotaFormSection/types';

export type PortainerNamespace = KubernetesNamespace;

// type returned via the internal portainer namespaces api, with simplified fields
// it is a record currently (legacy reasons), but it should be an array
export type Namespaces = Record<string, PortainerNamespace>;

export type NamespaceFormValues = {
  name: string;
  resourceQuota: ResourceQuotaFormValues;
  ingressClasses: IngressControllerClassMap[];
  registries: Registry[];
};

export type NamespacePayload = {
  Name: string;
  Owner: string;
  ResourceQuota: ResourceQuotaFormValues;
};

export type UpdateRegistryPayload = {
  Id: number;
  Namespaces: string[];
};
