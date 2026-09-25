import { ComponentType, createContext, useContext } from 'react';

export interface LayoutEnvironment {
  Id: number;
  Name: string;
  Type: number;
  ContainerEngine?: string;
  SecuritySettings?: {
    allowStackManagementForRegularUsers?: boolean;
  };
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
    children: React.ReactNode;
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

export function LayoutProvider({
  value,
  children,
}: {
  value: LayoutBindings;
  children: React.ReactNode;
}) {
  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
}

export function useLayoutBindings() {
  const value = useContext(LayoutContext);
  if (!value) {
    throw new Error('useLayoutBindings must be used inside LayoutProvider');
  }
  return value;
}

export function TestLayoutProvider({
  children,
  overrides = {},
}: {
  children: React.ReactNode;
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
