import type { AzureContainerInstanceProviderDto } from '../dto/provider';

/** Return the locations in which Azure Container Groups can be provisioned. */
export function getContainerGroupLocations(
  provider: AzureContainerInstanceProviderDto
) {
  return (
    provider.resourceTypes.find(
      ({ resourceType }) => resourceType === 'containerGroups'
    )?.locations ?? []
  );
}
