'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useRouteParams } from '@console/routing/useRouteParams';
import {
  type LayoutBindings,
  LayoutProvider,
} from '@console/layout/LayoutContext';
import { useStore } from 'zustand';

import { useEnvironment } from '@/domains/environments';
import collapsedLogo from '@/shared/assets/ico/vessel-hq-mark.svg';
import fullLogo from '@/shared/assets/images/vessel-hq-logo.svg';
import { invalidateAllQueries, queryClient } from '@/core/query';
import { applyTheme } from '@/core/theme/applyTheme';
import { usePublicSettings, useSettings } from '@/domains/settings';
import { EnvironmentType, PlatformType } from '@/domains/environments';
import {
  type ThemeColor,
  useIsCurrentUserTeamLeader,
  useUpdateUserMutation,
  userThemeOptions,
} from '@/domains/users';
import { baseHref } from '@/shared/browser-path';
import { useInfo } from '@/core/composition/useDockerInfo';
import { useApiVersion } from '@/core/composition/useDockerVersion';
import { environmentStore } from '@/core/hooks/current-environment-store';
import { useUIState } from '@/core/hooks/useUIState';
import {
  Authorized,
  useCurrentUser,
  useIsEdgeAdmin,
  useIsEnvironmentAdmin,
  useIsPureAdmin,
} from '@/core/session/useUser';
import { getPlatformType } from '@/domains/environments';
import { getPlatformIconByEnvironment } from '@/core/environment-management/environments/utils/get-platform-icon';
import { isBE } from '@/shared/feature-flags/feature-flags.service';
import { useSystemStatus } from '@/core/system/useSystemStatus';
import { useSystemVersion } from '@/core/system/useSystemVersion';

import { toLayoutPlatform } from './environmentPlatform';

const logos = {
  full: assetUrl(fullLogo),
  collapsed: assetUrl(collapsedLogo),
};

const themeOptions = userThemeOptions.map(({ id, label }) => ({ id, label }));

export function LayoutBindingsProvider({ children }: PropsWithChildren) {
  const suppressRouteSelection = useRef(false);
  const params = useRouteParams();
  const router = useRouter();
  const pathname = usePathname();
  const storedEnvironmentId = useStore(
    environmentStore,
    (store) => store.environmentId
  );
  const setEnvironmentId = useStore(
    environmentStore,
    (store) => store.setEnvironmentId
  );
  const selectedEnvironment = useStore(
    environmentStore,
    (store) => store.selectedEnvironment
  );
  const clearEnvironment = useStore(environmentStore, (store) => store.clear);
  const currentUser = useCurrentUser();
  const publicSettings = usePublicSettings();
  const isEdgeAdmin = useIsEdgeAdmin({ noEnvScope: true });
  const isEnvironmentAdmin = useIsEnvironmentAdmin({ adminOnlyCE: true });
  const isPureAdmin = useIsPureAdmin();
  const settings = useSettings(undefined, isPureAdmin);
  const isTeamLeader = useIsCurrentUserTeamLeader();
  const routeEnvironmentId = Number(
    params.endpointId ?? params.environmentId
  );
  const environmentId =
    Number.isFinite(routeEnvironmentId) && routeEnvironmentId > 0
      ? routeEnvironmentId
      : storedEnvironmentId;
  const environmentQuery = useEnvironment(environmentId);
  const resolvedEnvironment =
    environmentQuery.data?.Id === environmentId
      ? environmentQuery.data
      : selectedEnvironment?.Id === environmentId
        ? selectedEnvironment
        : undefined;
  const routePlatform = getRoutePlatform(pathname);
  const platform = resolvedEnvironment
    ? getPlatformType(
        resolvedEnvironment.Type,
        resolvedEnvironment.ContainerEngine
      )
    : routePlatform;
  const isDockerEnvironment = platform === PlatformType.Docker;
  const infoQuery = useInfo(environmentId ?? 0, {
    select: (info) => !!info.Swarm?.NodeID && !!info.Swarm?.ControlAvailable,
    enabled: isDockerEnvironment,
  });
  const apiVersionQuery = useApiVersion(
    isDockerEnvironment ? (environmentId ?? 0) : undefined
  );
  const versionQuery = useSystemVersion();
  const statusQuery = useSystemStatus();
  const dismissUpdate = useUIState((state) => state.dismissUpdateVersion);
  const dismissedUpdateVersion = useUIState(
    (state) => state.dismissedUpdateVersion
  );
  const updateUser = useUpdateUserMutation();
  const userTheme = currentUser.user?.ThemeSettings?.color as
    | ThemeColor
    | undefined;

  useEffect(() => {
    if (currentUser.user) {
      applyTheme(userTheme ?? 'auto');
    }
  }, [currentUser.user, userTheme]);

  useEffect(() => {
    if (suppressRouteSelection.current) {
      if (!Number.isFinite(routeEnvironmentId) || routeEnvironmentId <= 0) {
        suppressRouteSelection.current = false;
      }
      return;
    }
    if (
      Number.isFinite(routeEnvironmentId) &&
      routeEnvironmentId > 0 &&
      routeEnvironmentId !== storedEnvironmentId
    ) {
      setEnvironmentId(routeEnvironmentId);
    }
  }, [
    routeEnvironmentId,
    setEnvironmentId,
    storedEnvironmentId,
  ]);

  const environment = useMemo(() => {
    if (platform === undefined || !environmentId) return undefined;

    if (!resolvedEnvironment) {
      const type = getFallbackEnvironmentType(platform);
      return {
        Id: environmentId,
        Name: `Environment ${environmentId}`,
        Type: type,
        platform: toLayoutPlatform(platform),
        PlatformIcon: getPlatformIconByEnvironment(type),
      };
    }

    return {
      ...resolvedEnvironment,
      platform: toLayoutPlatform(platform),
      PlatformIcon: getPlatformIconByEnvironment(
        resolvedEnvironment.Type,
        resolvedEnvironment.ContainerEngine
      ),
    };
  }, [environmentId, platform, resolvedEnvironment]);

  const docsUrl = useMemo(() => {
    let url = 'https://docs.portainer.io/';
    if (versionQuery.data?.VersionSupport) {
      url += versionQuery.data.VersionSupport.toLowerCase();
    }
    return url;
  }, [versionQuery.data]);

  const handleClearEnvironment = useCallback(() => {
    suppressRouteSelection.current = true;
    clearEnvironment();
    if (params.endpointId || params.environmentId) {
      router.push('/');
    }
  }, [
    clearEnvironment,
    params.endpointId,
    params.environmentId,
    router,
  ]);

  const updateUserTheme = useCallback(
    (color: string) => {
      applyTheme(color as never);
      updateUser.mutate({ theme: { color: color as ThemeColor } });
    },
    [updateUser]
  );

  const clearQueries = useCallback(() => queryClient.clear(), []);
  const reload = useCallback(() => {
    void invalidateAllQueries(queryClient);
    router.refresh();
  }, [router]);

  const docker = useMemo(
    () => ({
      isEnvironmentAdmin: isEnvironmentAdmin.authorized,
      isSwarmManager: !!infoQuery.data,
      apiVersion: apiVersionQuery,
    }),
    [apiVersionQuery, infoQuery.data, isEnvironmentAdmin.authorized]
  );

  const value = useMemo<LayoutBindings>(
    () => ({
      isBE,
      ddExtension: typeof window !== 'undefined' && !!window.ddExtension,
      isPureAdmin,
      isAdmin: isEdgeAdmin.isAdmin,
      isTeamLeader,
      user: currentUser.user,
      publicSettings: publicSettings.data,
      settings: settings.data,
      environment,
      environmentLoading: Boolean(environmentId) && environmentQuery.isLoading,
      clearEnvironment: handleClearEnvironment,
      docker,
      Authorized,
      version: versionQuery.data,
      status: statusQuery.data,
      updateUserTheme,
      dismissUpdate,
      dismissedUpdateVersion,
      clearQueries,
      reload,
      docsUrl,
      baseHref,
      logos,
      themeOptions,
    }),
    [
      clearQueries,
      currentUser.user,
      dismissUpdate,
      dismissedUpdateVersion,
      docsUrl,
      environment,
      environmentId,
      environmentQuery.isLoading,
      handleClearEnvironment,
      docker,
      isEdgeAdmin.isAdmin,
      isPureAdmin,
      isTeamLeader,
      publicSettings.data,
      reload,
      settings.data,
      statusQuery.data,
      updateUserTheme,
      versionQuery.data,
    ]
  );

  return <LayoutProvider value={value}>{children}</LayoutProvider>;
}

function assetUrl(asset: string | { src?: string }) {
  return typeof asset === 'string' ? asset : asset.src || '';
}

function getRoutePlatform(pathname: string): PlatformType | undefined {
  const platform = pathname.split('/').filter(Boolean)[1];

  switch (platform) {
    case 'docker':
      return PlatformType.Docker;
    case 'kubernetes':
      return PlatformType.Kubernetes;
    case 'azure':
      return PlatformType.Azure;
    default:
      return undefined;
  }
}

function getFallbackEnvironmentType(platform: PlatformType): EnvironmentType {
  switch (platform) {
    case PlatformType.Kubernetes:
      return EnvironmentType.KubernetesLocal;
    case PlatformType.Azure:
      return EnvironmentType.Azure;
    case PlatformType.Docker:
    case PlatformType.Podman:
      return EnvironmentType.Docker;
  }
}
