import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
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
  const environmentId = useStore(
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
  const environmentQuery = useEnvironment(environmentId);
  const infoQuery = useInfo(environmentId ?? 0, {
    select: (info) => !!info.Swarm?.NodeID && !!info.Swarm?.ControlAvailable,
  });
  const apiVersionQuery = useApiVersion(environmentId ?? 0);
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
    const routeEnvironmentId = Number(
      params.endpointId ?? params.environmentId
    );
    if (suppressRouteSelection.current) {
      if (!Number.isFinite(routeEnvironmentId) || routeEnvironmentId <= 0) {
        suppressRouteSelection.current = false;
      }
      return;
    }
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
    const queriedEnvironment =
      environmentQuery.data?.Id === environmentId
        ? environmentQuery.data
        : undefined;
    const value = queriedEnvironment ?? selectedEnvironment;
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
  }, [environmentId, environmentQuery.data, selectedEnvironment]);

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
      router.push(buildHref('/', {}, pathname));
    }
  }, [
    clearEnvironment,
    params.endpointId,
    params.environmentId,
    pathname,
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
      docker: {
        isEnvironmentAdmin: isEnvironmentAdmin.authorized,
        isSwarmManager: !!infoQuery.data,
        apiVersion: apiVersionQuery,
      },
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
      apiVersionQuery,
      clearQueries,
      currentUser.user,
      dismissUpdate,
      dismissedUpdateVersion,
      docsUrl,
      environment,
      environmentId,
      environmentQuery.isLoading,
      handleClearEnvironment,
      infoQuery.data,
      isEdgeAdmin.isAdmin,
      isEnvironmentAdmin.authorized,
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
