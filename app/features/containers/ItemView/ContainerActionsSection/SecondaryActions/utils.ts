import { EnvironmentSecuritySettings } from '@/features/environments';

/**
 * Checks if security settings restrict regular users from container operations
 */
export function isRegularUserRestricted(
  securitySettings: EnvironmentSecuritySettings
): boolean {
  return (
    !securitySettings.allowContainerCapabilitiesForRegularUsers ||
    !securitySettings.allowBindMountsForRegularUsers ||
    !securitySettings.allowDeviceMappingForRegularUsers ||
    !securitySettings.allowSysctlSettingForRegularUsers ||
    !securitySettings.allowSecurityOptForRegularUsers ||
    !securitySettings.allowHostNamespaceForRegularUsers ||
    !securitySettings.allowPrivilegedModeForRegularUsers
  );
}
