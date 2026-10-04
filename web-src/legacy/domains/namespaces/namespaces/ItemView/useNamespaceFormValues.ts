import { useMemo } from 'react';

import { StorageClass } from '@/domains/environments';
import { Registry } from '@/domains/registries';
import { parseCPU } from '@/domains/clusters';
import type { IngressControllerClassMap } from '@/domains/clusters';

import { NamespaceFormValues, PortainerNamespace } from '../types';
import { megaBytesValue, convertBase2ToMiB } from '../resourceQuotaUtils';

interface ComputeInitialValuesParams {
  namespaceName: string;
  environmentId: number;
  storageClasses?: StorageClass[];
  namespace?: PortainerNamespace;
  registries?: Registry[];
  ingressClasses?: IngressControllerClassMap[];
}

export function computeInitialValues({
  namespaceName,
  environmentId,
  namespace,
  registries,
  ingressClasses,
}: ComputeInitialValuesParams): NamespaceFormValues | null {
  if (!namespace) {
    return null;
  }
  const memory = namespace.ResourceQuota?.spec?.hard?.['requests.memory'] ?? '';
  const cpu = namespace.ResourceQuota?.spec?.hard?.['requests.cpu'] ?? '';

  const registriesUsed = registries?.filter((registry) =>
    registry.RegistryAccesses?.[`${environmentId}`]?.Namespaces.includes(
      namespaceName
    )
  );

  return {
    name: namespaceName,
    ingressClasses: ingressClasses ?? [],
    resourceQuota: {
      enabled: !!memory || !!cpu,
      memory: `${megaBytesValue(convertBase2ToMiB(memory))}`,
      cpu: `${parseCPU(cpu)}`,
    },
    registries: registriesUsed ?? [],
  };
}

export function useNamespaceFormValues({
  namespaceName,
  environmentId,
  storageClasses,
  namespace,
  registries,
  ingressClasses,
}: ComputeInitialValuesParams): NamespaceFormValues | null {
  return useMemo(
    () =>
      computeInitialValues({
        namespaceName,
        environmentId,
        storageClasses,
        namespace,
        registries,
        ingressClasses,
      }),
    [
      storageClasses,
      namespace,
      registries,
      namespaceName,
      ingressClasses,
      environmentId,
    ]
  );
}
