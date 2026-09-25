export interface AzureContainerInstanceProviderDto {
  id: string;
  namespace: string;
  resourceTypes: Array<{
    resourceType: 'containerGroups' | string;
    locations: string[];
  }>;
}
