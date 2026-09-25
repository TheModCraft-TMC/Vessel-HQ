import axios from '@/shared/http';

import {
  AzureContainerGroupDto,
  CreateAzureContainerGroupInput,
} from '../dto/container-group';
import { AzureContainerInstanceProviderDto } from '../dto/provider';
import { AzureResourceGroupDto } from '../dto/resource-group';
import { AzureSubscriptionDto } from '../dto/subscription';
import { transformToPayload } from '../mappers/transform-to-payload';
import { parseAzureAciError } from '../errors/parse-azure-aci-error';

import {
  buildContainerGroupUrl,
  buildProviderUrl,
  buildResourceGroupUrl,
  buildSubscriptionsUrl,
} from './urls';

const CONTAINER_GROUP_API_VERSION = '2018-04-01';

export interface AzureAciClient {
  getSubscriptions(environmentId: number): Promise<AzureSubscriptionDto[]>;
  getSubscription(
    environmentId: number,
    subscriptionId: string
  ): Promise<AzureSubscriptionDto>;
  getResourceGroups(
    environmentId: number,
    subscriptionId: string
  ): Promise<AzureResourceGroupDto[]>;
  getResourceGroup(
    environmentId: number,
    subscriptionId: string,
    resourceGroupName: string
  ): Promise<AzureResourceGroupDto>;
  getProvider(
    environmentId: number,
    subscriptionId: string
  ): Promise<AzureContainerInstanceProviderDto>;
  createContainerGroup(
    model: CreateAzureContainerGroupInput,
    environmentId: number,
    subscriptionId: string,
    resourceGroupName: string
  ): Promise<AzureContainerGroupDto>;
  deleteContainerGroup(
    environmentId: number,
    containerGroupId: string
  ): Promise<void>;
  getContainerGroup(
    environmentId: number,
    subscriptionId: string,
    resourceGroupName: string,
    containerGroupName: string
  ): Promise<AzureContainerGroupDto>;
  getContainerGroups(
    environmentId: number,
    subscriptionId: string
  ): Promise<AzureContainerGroupDto[]>;
}

export const azureAciClient: AzureAciClient = {
  async getSubscriptions(environmentId) {
    try {
      const { data } = await axios.get<{ value: AzureSubscriptionDto[] }>(
        buildSubscriptionsUrl(environmentId),
        { params: { 'api-version': '2016-06-01' } }
      );
      return data.value;
    } catch (error) {
      throw parseAzureAciError(error, 'Unable to retrieve subscriptions');
    }
  },

  async getSubscription(environmentId, subscriptionId) {
    try {
      const { data } = await axios.get<AzureSubscriptionDto>(
        buildSubscriptionsUrl(environmentId, subscriptionId),
        { params: { 'api-version': '2016-06-01' } }
      );
      return data;
    } catch (error) {
      throw parseAzureAciError(error, 'Unable to retrieve subscription');
    }
  },

  async getResourceGroups(environmentId, subscriptionId) {
    try {
      const { data } = await axios.get<{ value: AzureResourceGroupDto[] }>(
        buildResourceGroupUrl(environmentId, subscriptionId),
        { params: { 'api-version': '2018-02-01' } }
      );
      return data.value;
    } catch (error) {
      throw parseAzureAciError(error, 'Unable to retrieve resource groups');
    }
  },

  async getResourceGroup(environmentId, subscriptionId, resourceGroupName) {
    try {
      const { data } = await axios.get<AzureResourceGroupDto>(
        buildResourceGroupUrl(environmentId, subscriptionId, resourceGroupName),
        { params: { 'api-version': '2018-02-01' } }
      );
      return data;
    } catch (error) {
      throw parseAzureAciError(error, 'Unable to retrieve resource group');
    }
  },

  async getProvider(environmentId, subscriptionId) {
    try {
      const { data } = await axios.get<AzureContainerInstanceProviderDto>(
        buildProviderUrl(environmentId, subscriptionId),
        { params: { 'api-version': '2018-02-01' } }
      );
      return data;
    } catch (error) {
      throw parseAzureAciError(error, 'Unable to retrieve provider');
    }
  },

  async createContainerGroup(
    model,
    environmentId,
    subscriptionId,
    resourceGroupName
  ) {
    const payload = transformToPayload(model);

    try {
      const { data } = await axios.put<AzureContainerGroupDto>(
        buildContainerGroupUrl(
          environmentId,
          subscriptionId,
          resourceGroupName,
          model.name
        ),
        payload,
        { params: { 'api-version': CONTAINER_GROUP_API_VERSION } }
      );
      return data;
    } catch (error) {
      throw parseAzureAciError(error);
    }
  },

  async deleteContainerGroup(environmentId, containerGroupId) {
    try {
      await axios.delete(
        `/endpoints/${environmentId}/azure${containerGroupId}`,
        {
          params: { 'api-version': CONTAINER_GROUP_API_VERSION },
        }
      );
    } catch (error) {
      throw parseAzureAciError(error, 'Unable to remove container group');
    }
  },

  async getContainerGroup(
    environmentId,
    subscriptionId,
    resourceGroupName,
    containerGroupName
  ) {
    try {
      const { data } = await axios.get<AzureContainerGroupDto>(
        buildContainerGroupUrl(
          environmentId,
          subscriptionId,
          resourceGroupName,
          containerGroupName
        ),
        { params: { 'api-version': CONTAINER_GROUP_API_VERSION } }
      );

      return data;
    } catch (error) {
      throw parseAzureAciError(error);
    }
  },

  async getContainerGroups(environmentId, subscriptionId) {
    try {
      const { data } = await axios.get<{ value: AzureContainerGroupDto[] }>(
        buildContainerGroupUrl(environmentId, subscriptionId),
        { params: { 'api-version': CONTAINER_GROUP_API_VERSION } }
      );

      return data.value;
    } catch (error) {
      throw parseAzureAciError(error, 'Unable to retrieve container groups');
    }
  },
};
