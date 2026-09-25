import { NamespaceStatus, ResourceQuota } from 'kubernetes-types/core/v1';

export interface KubernetesNamespaceDto {
  Id?: string;
  Name?: string;
  Status?: NamespaceStatus;
  UnhealthyEventCount?: number;
  Annotations?: Record<string, string> | null;
  CreationDate?: string;
  NamespaceOwner?: string;
  IsSystem?: boolean;
  IsDefault?: boolean;
  ResourceQuota?: ResourceQuota | null;
}

export interface KubernetesNamespace {
  Id: string;
  Name: string;
  Status: NamespaceStatus;
  UnhealthyEventCount: number;
  Annotations: Record<string, string> | null;
  CreationDate: string;
  NamespaceOwner: string;
  IsSystem: boolean;
  IsDefault: boolean;
  ResourceQuota?: ResourceQuota | null;
}
