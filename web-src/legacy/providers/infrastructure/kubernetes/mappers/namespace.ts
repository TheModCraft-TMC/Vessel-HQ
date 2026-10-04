import { KubernetesNamespace, KubernetesNamespaceDto } from '../dto/namespace';

export function mapKubernetesNamespace(
  dto: KubernetesNamespaceDto
): KubernetesNamespace {
  return {
    Id: dto.Id ?? dto.Name ?? '',
    Name: dto.Name ?? '',
    Status: dto.Status ?? { phase: 'Unknown' },
    UnhealthyEventCount: dto.UnhealthyEventCount ?? 0,
    Annotations: dto.Annotations ?? null,
    CreationDate: dto.CreationDate ?? '',
    NamespaceOwner: dto.NamespaceOwner ?? '',
    IsSystem: dto.IsSystem ?? false,
    IsDefault: dto.IsDefault ?? false,
    ResourceQuota: dto.ResourceQuota,
  };
}
