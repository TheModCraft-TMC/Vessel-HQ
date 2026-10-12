'use client';

import {
  type ComponentType,
  type Context,
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from 'react';

export interface LayoutEnvironment {
  Id: number;
  Name: string;
  Type: number;
  ContainerEngine?: string;
  SecuritySettings?: { allowStackManagementForRegularUsers?: boolean };
  platform: 'azure' | 'docker' | 'podman' | 'kubernetes';
  PlatformIcon: ComponentType<{ className?: string }>;
}

export interface LayoutUser {
  Id: number;
  Username: string;
  ThemeSettings?: { color?: string };
}

export interface LayoutSettings {
  LogoURL?: string;
  EnableEdgeComputeFeatures?: boolean;
  TrustOnFirstConnect?: boolean;
}

export interface LayoutVersion {
  UpdateAvailable: boolean;
  LatestVersion: string;
  ServerVersion: string;
  VersionSupport: string;
  DatabaseVersion: string;
  Build: Record<string, string>;
  Dependencies: Record<string, string>;
  Runtime: { Env?: string[] };
}

export interface LayoutStatus {
  Edition: string;
}

export interface LayoutBindings {
  isBE: boolean;
  ddExtension: boolean;
  isPureAdmin: boolean;
  isAdmin: boolean;
  isTeamLeader: boolean;
  user?: LayoutUser;
  publicSettings?: LayoutSettings;
  settings?: LayoutSettings;
  environment?: LayoutEnvironment;
  environmentLoading: boolean;
  clearEnvironment(): void;
  docker: {
    isEnvironmentAdmin: boolean;
    isSwarmManager: boolean;
    apiVersion: number;
  };
  Authorized: ComponentType<{
    authorizations: string;
    adminOnlyCE?: boolean;
    environmentId?: number;
    children: ReactNode;
  }>;
  version?: LayoutVersion;
  status?: LayoutStatus;
  updateUserTheme(color: string): void;
  dismissUpdate(version: string): void;
  dismissedUpdateVersion?: string;
  clearQueries(): void;
  reload(): void;
  docsUrl: string;
  baseHref(): string;
  logos: { full: string; collapsed: string };
  themeOptions: Array<{ id: string; label: string }>;
}

const LayoutContext = createContext<LayoutBindings | null>(null);

export type LayoutIdentity = Pick<
  LayoutBindings,
  | 'isBE'
  | 'ddExtension'
  | 'isPureAdmin'
  | 'isAdmin'
  | 'isTeamLeader'
  | 'user'
  | 'publicSettings'
  | 'settings'
  | 'Authorized'
>;

export type LayoutEnvironmentState = Pick<
  LayoutBindings,
  'environment' | 'environmentLoading' | 'docker'
>;

export type LayoutSystemState = Pick<
  LayoutBindings,
  'version' | 'status' | 'docsUrl' | 'dismissedUpdateVersion'
>;

export type LayoutActions = Pick<
  LayoutBindings,
  | 'clearEnvironment'
  | 'updateUserTheme'
  | 'dismissUpdate'
  | 'clearQueries'
  | 'reload'
>;

export type LayoutStaticValues = Pick<
  LayoutBindings,
  'baseHref' | 'logos' | 'themeOptions'
>;

const LayoutIdentityContext = createContext<LayoutIdentity | null>(null);
const LayoutEnvironmentContext =
  createContext<LayoutEnvironmentState | null>(null);
const LayoutSystemContext = createContext<LayoutSystemState | null>(null);
const LayoutActionsContext = createContext<LayoutActions | null>(null);
const LayoutStaticContext = createContext<LayoutStaticValues | null>(null);

export function LayoutProvider({
  value,
  children,
}: {
  value: LayoutBindings;
  children: ReactNode;
}) {
  const identity = useMemo<LayoutIdentity>(
    () => ({
      isBE: value.isBE,
      ddExtension: value.ddExtension,
      isPureAdmin: value.isPureAdmin,
      isAdmin: value.isAdmin,
      isTeamLeader: value.isTeamLeader,
      user: value.user,
      publicSettings: value.publicSettings,
      settings: value.settings,
      Authorized: value.Authorized,
    }),
    [
      value.Authorized,
      value.ddExtension,
      value.isAdmin,
      value.isBE,
      value.isPureAdmin,
      value.isTeamLeader,
      value.publicSettings,
      value.settings,
      value.user,
    ]
  );
  const environment = useMemo<LayoutEnvironmentState>(
    () => ({
      environment: value.environment,
      environmentLoading: value.environmentLoading,
      docker: value.docker,
    }),
    [value.docker, value.environment, value.environmentLoading]
  );
  const system = useMemo<LayoutSystemState>(
    () => ({
      version: value.version,
      status: value.status,
      docsUrl: value.docsUrl,
      dismissedUpdateVersion: value.dismissedUpdateVersion,
    }),
    [
      value.dismissedUpdateVersion,
      value.docsUrl,
      value.status,
      value.version,
    ]
  );
  const actions = useMemo<LayoutActions>(
    () => ({
      clearEnvironment: value.clearEnvironment,
      updateUserTheme: value.updateUserTheme,
      dismissUpdate: value.dismissUpdate,
      clearQueries: value.clearQueries,
      reload: value.reload,
    }),
    [
      value.clearEnvironment,
      value.clearQueries,
      value.dismissUpdate,
      value.reload,
      value.updateUserTheme,
    ]
  );
  const staticValues = useMemo<LayoutStaticValues>(
    () => ({
      baseHref: value.baseHref,
      logos: value.logos,
      themeOptions: value.themeOptions,
    }),
    [value.baseHref, value.logos, value.themeOptions]
  );

  return (
    <LayoutIdentityContext.Provider value={identity}>
      <LayoutEnvironmentContext.Provider value={environment}>
        <LayoutSystemContext.Provider value={system}>
          <LayoutActionsContext.Provider value={actions}>
            <LayoutStaticContext.Provider value={staticValues}>
              <LayoutContext.Provider value={value}>
                {children}
              </LayoutContext.Provider>
            </LayoutStaticContext.Provider>
          </LayoutActionsContext.Provider>
        </LayoutSystemContext.Provider>
      </LayoutEnvironmentContext.Provider>
    </LayoutIdentityContext.Provider>
  );
}

export function useLayoutIdentity() {
  return useRequiredLayoutContext(LayoutIdentityContext);
}

export function useLayoutEnvironment() {
  return useRequiredLayoutContext(LayoutEnvironmentContext);
}

export function useLayoutSystem() {
  return useRequiredLayoutContext(LayoutSystemContext);
}

export function useLayoutActions() {
  return useRequiredLayoutContext(LayoutActionsContext);
}

export function useLayoutStaticValues() {
  return useRequiredLayoutContext(LayoutStaticContext);
}

export function useLayoutBindings() {
  return useRequiredLayoutContext(LayoutContext);
}

function useRequiredLayoutContext<T>(context: Context<T | null>) {
  const value = useContext(context);
  if (!value) throw new Error('Layout hooks must be used inside LayoutProvider');
  return value;
}

export function TestLayoutProvider({
  children,
  overrides = {},
}: {
  children: ReactNode;
  overrides?: Partial<LayoutBindings>;
}) {
  const defaults: LayoutBindings = {
    isBE: false,
    ddExtension: false,
    isPureAdmin: false,
    isAdmin: false,
    isTeamLeader: false,
    environmentLoading: false,
    clearEnvironment: () => undefined,
    docker: { isEnvironmentAdmin: false, isSwarmManager: false, apiVersion: 0 },
    Authorized: ({ children: content }) => <>{content}</>,
    updateUserTheme: () => undefined,
    dismissUpdate: () => undefined,
    clearQueries: () => undefined,
    reload: () => undefined,
    docsUrl: 'https://docs.portainer.io/',
    baseHref: () => '/',
    logos: { full: '', collapsed: '' },
    themeOptions: [],
  };

  return (
    <LayoutProvider value={{ ...defaults, ...overrides }}>
      {children}
    </LayoutProvider>
  );
}
