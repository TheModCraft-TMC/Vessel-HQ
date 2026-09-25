import { PropsWithChildren, useEffect, useMemo } from 'react';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { useStore } from 'zustand';

import { useIsCurrentUserTeamLeader } from '@/domains/users';
import type { ThemeColor } from '@/domains/users';
import { usePublicSettings, useSettings } from '@/domains/settings';
import { useEnvironment } from '@/domains/environments';
import { useUpdateUserMutation, userThemeOptions } from '@/domains/users';
import {
  useCurrentUser,
  useIsEdgeAdmin,
  useIsEnvironmentAdmin,
  useIsPureAdmin,
  Authorized,
} from '@/react/hooks/useUser';
import { useInfo } from '@/react/docker/proxy/queries/useInfo';
import { useApiVersion } from '@/react/docker/proxy/queries/useVersion';
import { environmentStore } from '@/react/hooks/current-environment-store';
import { useSystemStatus } from '@/react/portainer/system/useSystemStatus';
import { useSystemVersion } from '@/react/portainer/system/useSystemVersion';
import { useUIState } from '@/react/hooks/useUIState';
import { getPlatformType } from '@/react/portainer/environments/utils';
import { getPlatformIconByEnvironment } from '@/react/portainer/environments/utils/get-platform-icon';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { queryClient, invalidateAllQueries } from '@/core/query';
import { applyTheme } from '@/core/theme/applyTheme';
import { baseHref } from '@/portainer/helpers/pathHelper';
import fullLogo from '@/assets/images/vessel-hq-logo.svg';
import collapsedLogo from '@/assets/ico/vessel-hq-mark.svg';
import {
  LayoutProvider,
  type LayoutBindings,
} from '@/ui/layouts/layout-context';

export function LayoutBindingsProvider({ children }: PropsWithChildren) {
  const { state, params } = useCurrentStateAndParams();
  const router = useRouter();
  const envState = useStore(environmentStore);
  const currentUser = useCurrentUser();
  const publicSettings = usePublicSettings();
  const settings = useSettings();
  const isEdgeAdmin = useIsEdgeAdmin({ noEnvScope: true });
  const isEnvironmentAdmin = useIsEnvironmentAdmin({ adminOnlyCE: true });
  const isPureAdmin = useIsPureAdmin();
  const isTeamLeader = useIsCurrentUserTeamLeader();
  const environmentQuery = useEnvironment(envState.environmentId);
  const infoQuery = useInfo(envState.environmentId ?? 0, {
    select: (info) => !!info.Swarm?.NodeID && !!info.Swarm?.ControlAvailable,
  });
  const apiVersionQuery = useApiVersion(envState.environmentId ?? 0);
  const versionQuery = useSystemVersion();
  const statusQuery = useSystemStatus();
  const uiState = useUIState();
  const updateUser = useUpdateUserMutation();

  useEffect(() => {
    const environmentId = Number(params.endpointId ?? params.environmentId);
    if (Number.isFinite(environmentId) && environmentId > 0) {
      envState.setEnvironmentId(environmentId);
    }
  }, [envState, params.endpointId, params.environmentId]);

  const environment = useMemo(() => {
    const value = environmentQuery.data;
    if (!value) return undefined;
    const platform = getPlatformType(value.Type, value.ContainerEngine);
    return {
      ...value,
      platform: ['azure', 'docker', 'podman', 'kubernetes'][platform] as
        | 'azure'
        | 'docker'
        | 'podman'
        | 'kubernetes',
      PlatformIcon: getPlatformIconByEnvironment(
        value.Type,
        value.ContainerEngine
      ),
    };
  }, [environmentQuery.data]);

  const docsUrl = useMemo(() => {
    let url = 'https://docs.portainer.io/';
    if (versionQuery.data?.VersionSupport) {
      url += versionQuery.data.VersionSupport.toLowerCase();
    }
    const docs =
      state.data &&
      typeof state.data === 'object' &&
      'docs' in state.data &&
      typeof state.data.docs === 'string'
        ? state.data.docs
        : undefined;
    return docs ? url + docs : url;
  }, [state.data, versionQuery.data]);

  const value: LayoutBindings = {
    isBE,
    ddExtension: !!window.ddExtension,
    isPureAdmin,
    isAdmin: isEdgeAdmin.isAdmin,
    isTeamLeader,
    user: currentUser.user,
    publicSettings: publicSettings.data,
    settings: settings.data,
    environment,
    environmentLoading: environmentQuery.isLoading,
    clearEnvironment: () => {
      if (params.endpointId || params.environmentId)
        router.stateService.go('portainer.home');
      envState.clear();
    },
    docker: {
      isEnvironmentAdmin: isEnvironmentAdmin.authorized,
      isSwarmManager: !!infoQuery.data,
      apiVersion: apiVersionQuery ?? 0,
    },
    Authorized,
    version: versionQuery.data,
    status: statusQuery.data,
    updateUserTheme: (color) => {
      applyTheme(color as never);
      updateUser.mutate({ theme: { color: color as ThemeColor } });
    },
    dismissUpdate: uiState.dismissUpdateVersion,
    dismissedUpdateVersion: uiState.dismissedUpdateVersion,
    clearQueries: () => queryClient.clear(),
    reload: () => {
      void invalidateAllQueries(queryClient);
      router.stateService.reload();
    },
    docsUrl,
    baseHref,
    logos: { full: fullLogo, collapsed: collapsedLogo },
    themeOptions: userThemeOptions.map(({ id, label }) => ({ id, label })),
  };

  return <LayoutProvider value={value}>{children}</LayoutProvider>;
}
