import {
  AzureContainerInstanceProviderDto,
  getContainerGroupLocations,
  AzureResourceGroupDto,
  AzureSubscriptionDto,
} from '@/providers/infrastructure/azure-aci';

import { ProviderViewModel, ResourceGroup, Subscription } from '../models';

export function toSubscription(dto: AzureSubscriptionDto): Subscription {
  return { ...dto };
}

export function toResourceGroup(dto: AzureResourceGroupDto): ResourceGroup {
  return { ...dto };
}

export function toProviderViewModel(
  dto: AzureContainerInstanceProviderDto
): ProviderViewModel {
  return {
    id: dto.id,
    namespace: dto.namespace,
    locations: getContainerGroupLocations(dto),
  };
}
