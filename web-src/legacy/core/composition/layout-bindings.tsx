import { PropsWithChildren, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';
import { useRouteParams } from '@console/console/routing/useRouteParams';
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

import { toLayoutPlatform } from './environment-platform';

export function LayoutBindingsProvider({ children }: PropsWithChildren) {
  const params = useRouteParams();
  const router = useRouter();
  const pathname = usePathname();
  const environmentId = useStore(
    environmentStore,
    (store) => store.environmentId
  );
  const setEnvironmentId = useStore(
    environmentStore,
    (store) => store.setEnvironmentId
  );
  const clearEnvironment = useStore(environmentStore, (store) => store.clear);
  const currentUser = useCurrentUser();
  const publicSettings = usePublicSettings();
  const isEdgeAdmin = useIsEdgeAdmin({ noEnvScope: true });
  const isEnvironmentAdmin = useIsEnvironmentAdmin({ adminOnlyCE: true });
  const isPureAdmin = useIsPureAdmin();
  const settings = useSettings(undefined, isPureAdmin);
  const isTeamLeader = useIsCurrentUserTeamLeader();
  const environmentQuery = useEnvironment(environmentId);
  const infoQuery = useInfo(environmentId ?? 0, {
    select: (info) => !!info.Swarm?.NodeID && !!info.Swarm?.ControlAvailable,
  });
  const apiVersionQuery = useApiVersion(environmentId ?? 0);
  const versionQuery = useSystemVersion();
  const statusQuery = useSystemStatus();
  const uiState = useUIState();
  const updateUser = useUpdateUserMutation();

  useEffect(() => {
    const routeEnvironmentId = Number(
      params.endpointId ?? params.environmentId
    );
    if (
      Number.isFinite(routeEnvironmentId) &&
      routeEnvironmentId > 0 &&
      routeEnvironmentId !== environmentId
    ) {
      setEnvironmentId(routeEnvironmentId);
    }
  }, [
    environmentId,
    params.endpointId,
    params.environmentId,
    setEnvironmentId,
  ]);

  const environment = useMemo(() => {
    const value = environmentQuery.data;
    if (!value) return undefined;
    const platform = getPlatformType(value.Type, value.ContainerEngine);
    return {
      ...value,
      platform: toLayoutPlatform(platform),
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
    return url;
  }, [versionQuery.data]);

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
        router.push(buildHref('/', {}, pathname));
      clearEnvironment();
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
      router.refresh();
    },
    docsUrl,
    baseHref,
    logos: {
      full: assetUrl(fullLogo),
      collapsed: assetUrl(collapsedLogo),
    },
    themeOptions: userThemeOptions.map(({ id, label }) => ({ id, label })),
  };

  return <LayoutProvider value={value}>{children}</LayoutProvider>;
}

function assetUrl(asset: string | { src?: string }) {
  return typeof asset === 'string' ? asset : asset.src || '';
}
