import axios, { parseAxiosError } from '@/shared/http';

import {
  AzureContainerGroupDto,
  CreateAzureContainerGroupInput,
} from '../dto/container-group';
import { transformToPayload } from '../mappers/transform-to-payload';

import { buildContainerGroupUrl } from './urls';

const CONTAINER_GROUP_API_VERSION = '2018-04-01';

export interface AzureAciClient {
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
      throw parseAxiosError(error);
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
      throw parseAxiosError(error, 'Unable to remove container group');
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
      throw parseAxiosError(error);
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
      throw parseAxiosError(error, 'Unable to retrieve container groups');
    }
  },
};
