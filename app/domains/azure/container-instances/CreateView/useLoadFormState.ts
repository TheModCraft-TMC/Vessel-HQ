import { EnvironmentId } from '@/domains/environments';
import {
  ContainerInstanceFormValues,
  ProviderViewModel,
  ResourceGroup,
  Subscription,
} from '@/domains/azure/types';
import { parseAccessControlFormData } from '@/react/portainer/access-control/utils';
import { useCurrentUser } from '@/react/hooks/useUser';
import { useProvider } from '@/domains/azure/queries/useProvider';
import { useResourceGroups } from '@/domains/azure/queries/useResourceGroups';
import { useSubscriptions } from '@/domains/azure/queries/useSubscriptions';

import {
  getSubscriptionLocations,
  getSubscriptionResourceGroups,
} from './utils';

export function useLoadFormState(environmentId: EnvironmentId) {
  const { data: subscriptions, isLoading: isLoadingSubscriptions } =
    useSubscriptions(environmentId);
  const { resourceGroups, isLoading: isLoadingResourceGroups } =
    useResourceGroups(environmentId, subscriptions);
  const { providers, isLoading: isLoadingProviders } = useProvider(
    environmentId,
    subscriptions
  );

  const isLoading =
    isLoadingSubscriptions || isLoadingResourceGroups || isLoadingProviders;

  return { isLoading, subscriptions, resourceGroups, providers };
}

export function useFormState(
  subscriptions: Subscription[] = [],
  resourceGroups: Record<string, ResourceGroup[]> = {},
  providers: Record<string, ProviderViewModel> = {},
  defaultValues?: Partial<ContainerInstanceFormValues>
) {
  const { user, isPureAdmin } = useCurrentUser();

  const subscriptionOptions = subscriptions.map((s) => ({
    value: s.subscriptionId,
    label: s.displayName,
  }));

  const initSubscriptionId = getFirstValue(subscriptionOptions);

  const subscriptionResourceGroups = getSubscriptionResourceGroups(
    initSubscriptionId,
    resourceGroups
  );

  const subscriptionLocations = getSubscriptionLocations(
    initSubscriptionId,
    providers
  );

  const initialValues: ContainerInstanceFormValues = {
    name: '',
    location: getFirstValue(subscriptionLocations),
    subscription: initSubscriptionId,
    resourceGroup: getFirstValue(subscriptionResourceGroups),
    image: '',
    os: 'Linux',
    memory: 1,
    cpu: 1,
    ports: [{ container: 80, host: 80, protocol: 'TCP' }],
    allocatePublicIP: true,
    accessControl: parseAccessControlFormData(isPureAdmin, user.Id),
    env: [],
    ...defaultValues,
  };

  return {
    initialValues,
    subscriptionOptions,
  };

  function getFirstValue<T>(arr: { value: T }[]) {
    if (arr.length === 0) {
      return undefined;
    }

    return arr[0].value;
  }
}
