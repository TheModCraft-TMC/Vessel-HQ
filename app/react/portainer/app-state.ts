import { getPublicSettings } from '@/react/portainer/settings/settings.service';
import { getSystemStatus } from '@/react/portainer/system/useSystemStatus';

import { getStoredValue, setStoredValue } from './storage';

interface ApplicationState {
  logo?: string;
  snapshotInterval?: string;
  enableEdgeComputeFeatures?: boolean;
  version?: string;
  edition?: string;
  instanceId?: string;
}

interface UIState {
  timesPasswordChangeSkipped: Record<number, number>;
}

interface AppState {
  application: ApplicationState;
  UI: UIState;
}

const state: AppState = {
  application: getStoredValue<ApplicationState>('APPLICATION_STATE', {}),
  UI: getStoredValue<UIState>('UI_STATE', {
    timesPasswordChangeSkipped: {},
  }),
};

export function getAppState() {
  return state;
}

export async function initializeAppState() {
  const [settings, status] = await Promise.all([
    getPublicSettings(),
    getSystemStatus(),
  ]);

  state.application = {
    logo: settings.LogoURL,
    enableEdgeComputeFeatures: settings.EnableEdgeComputeFeatures,
    version: status.Version,
    edition: status.Edition,
    instanceId: status.InstanceID,
  };
  persistApplicationState();
  return state;
}

export function updateApplicationState(
  values: Partial<ApplicationState>
) {
  state.application = { ...state.application, ...values };
  persistApplicationState();
}

export function getSkippedPasswordChanges(userId: number) {
  return state.UI.timesPasswordChangeSkipped[userId] ?? 0;
}

export function setPasswordChangeSkipped(userId: number) {
  state.UI.timesPasswordChangeSkipped[userId] =
    getSkippedPasswordChanges(userId) + 1;
  persistUIState();
}

export function resetPasswordChangeSkips(userId: number) {
  state.UI.timesPasswordChangeSkipped[userId] = 0;
  persistUIState();
}

export function clearAppState() {
  state.application = {};
}

function persistApplicationState() {
  setStoredValue('APPLICATION_STATE', state.application);
}

function persistUIState() {
  setStoredValue('UI_STATE', state.UI);
}
