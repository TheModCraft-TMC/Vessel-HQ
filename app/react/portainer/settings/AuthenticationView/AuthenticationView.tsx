import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import YAML from 'yaml';

import axios from '@/portainer/services/axios/axios';
import { notifySuccess } from '@/portainer/services/notifications';
import { withError } from '@/react-tools/react-query';
import { useTeams } from '@/react/portainer/users/teams/queries';

import { BoxSelector, BoxSelectorOption } from '@@/BoxSelector';
import { LoadingButton } from '@@/buttons';
import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { Input } from '@@/form-components/Input';
import { PortainerSelect } from '@@/form-components/PortainerSelect';
import { SwitchField } from '@@/form-components/SwitchField';
import { PageHeader } from '@@/PageHeader';
import { TextTip } from '@@/Tip/TextTip';
import { WebEditorForm } from '@@/WebEditorForm';
import { Widget } from '@@/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';
import { WidgetTitle } from '@@/Widget/WidgetTitle';

import { getSettings, updateSettings } from '../settings.service';
import {
  AuthenticationMethod,
  LDAPGroupSearchSettings,
  LDAPSearchSettings,
  LDAPSettings,
  OAuthSettings,
  OAuthStyle,
  Settings,
} from '../types';

import { AuthenticationMethodSelector } from './AuthenticationMethodSelector';
import { AutoUserProvisionToggle } from './AutoUserProvisionToggle/AutoUserProvisionToggle';
import { InternalAuth } from './InternalAuth';
import { LdapSettingsTestLogin } from './LDAPAuth/LdapSettingsTestLogin/LdapSettingsTestLogin';
import { AuthStyleField } from './OAuth';
import { SessionLifetimeSelect } from './SessionLifetimeSelect';
import { options as ldapOptions, SERVER_TYPES } from './ldap-options';

const settingsQueryKey = ['settings', 'authentication'] as const;

export function AuthenticationView() {
  const settingsQuery = useQuery(settingsQueryKey, getSettings, {
    ...withError('Unable to retrieve authentication settings'),
  });
  const teamsQuery = useTeams();

  if (!settingsQuery.data) {
    return null;
  }

  return (
    <AuthenticationForm
      key={settingsQuery.data.AuthenticationMethod}
      initialSettings={settingsQuery.data}
      teams={teamsQuery.data || []}
    />
  );
}

function AuthenticationForm({
  initialSettings,
  teams,
}: {
  initialSettings: Settings;
  teams: Array<{ Id: number; Name: string }>;
}) {
  const queryClient = useQueryClient();
  const initialLDAP = normalizeLDAP(initialSettings.LDAPSettings);
  const [settings, setSettings] = useState(initialSettings);
  const [ldap, setLDAP] = useState<LDAPSettings>(initialLDAP);
  const [oauth, setOAuth] = useState<OAuthSettings>(() =>
    normalizeOAuth(initialSettings.OAuthSettings)
  );
  const [authMethod, setAuthMethod] = useState<number>(() =>
    initialSettings.AuthenticationMethod === AuthenticationMethod.LDAP &&
    initialLDAP.ServerType === SERVER_TYPES.AD
      ? AuthenticationMethod.AD
      : initialSettings.AuthenticationMethod
  );
  const saveMutation = useMutation(saveSettings, {
    ...withError('Unable to update authentication settings'),
    onSuccess: (updated) => {
      queryClient.setQueryData(settingsQueryKey, updated);
      setSettings(updated);
      notifySuccess('Success', 'Authentication settings updated');
    },
  });

  return (
    <>
      <PageHeader
        title="Authentication settings"
        breadcrumbs={[
          { label: 'Settings', link: 'portainer.settings' },
          'Authentication',
        ]}
        reload
      />
      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetTitle title="Authentication" />
            <WidgetBody>
              <div className="form-horizontal">
                <FormSection title="Configuration">
                  <SessionLifetimeSelect
                    value={settings.UserSessionTimeout}
                    onChange={(UserSessionTimeout) =>
                      setSettings((current) => ({
                        ...current,
                        UserSessionTimeout,
                      }))
                    }
                  />
                  <TextTip color="orange">
                    Increasing session lifetime is recommended only when another
                    authentication layer protects Vessel HQ.
                  </TextTip>
                  <AuthenticationMethodSelector
                    value={authMethod}
                    onChange={(value) => {
                      setAuthMethod(value);
                      if (value === AuthenticationMethod.AD) {
                        setLDAP((current) => ({
                          ...current,
                          ServerType: SERVER_TYPES.AD,
                          AnonymousMode: false,
                        }));
                      }
                    }}
                  />
                </FormSection>

                {authMethod === AuthenticationMethod.Internal && (
                  <InternalAuth
                    value={settings.InternalAuthSettings}
                    onChange={(RequiredPasswordLength) =>
                      setSettings((current) => ({
                        ...current,
                        InternalAuthSettings: { RequiredPasswordLength },
                      }))
                    }
                    onSaveSettings={() => saveMutation.mutate()}
                    isLoading={saveMutation.isLoading}
                  />
                )}

                {(authMethod === AuthenticationMethod.LDAP ||
                  authMethod === AuthenticationMethod.AD) && (
                  <LDAPForm
                    value={ldap}
                    onChange={(value) =>
                      setLDAP((current) => ({ ...current, ...value }))
                    }
                    isAD={authMethod === AuthenticationMethod.AD}
                    isSaving={saveMutation.isLoading}
                    onSave={() => saveMutation.mutate()}
                  />
                )}

                {authMethod === AuthenticationMethod.OAuth && (
                  <OAuthForm
                    value={oauth}
                    onChange={(value) =>
                      setOAuth((current) => ({ ...current, ...value }))
                    }
                    teams={teams}
                    isSaving={saveMutation.isLoading}
                    onSave={() => saveMutation.mutate()}
                  />
                )}
              </div>
            </WidgetBody>
          </Widget>
        </div>
      </div>
    </>
  );

  async function saveSettings() {
    const AuthenticationMethodValue =
      authMethod === AuthenticationMethod.AD
        ? AuthenticationMethod.LDAP
        : authMethod;
    const preparedLDAP = prepareLDAP(ldap, authMethod);
    return updateSettings({
      ...settings,
      AuthenticationMethod: AuthenticationMethodValue,
      LDAPSettings: preparedLDAP,
      OAuthSettings: oauth,
    });
  }
}

function LDAPForm({
  value,
  onChange,
  isAD,
  isSaving,
  onSave,
}: {
  value: LDAPSettings;
  onChange(value: Partial<LDAPSettings>): void;
  isAD: boolean;
  isSaving: boolean;
  onSave(): void;
}) {
  const [searchYaml, setSearchYaml] = useState(() =>
    YAML.stringify(value.SearchSettings || [])
  );
  const [groupSearchYaml, setGroupSearchYaml] = useState(() =>
    YAML.stringify(value.GroupSearchSettings || [])
  );
  const [caCertFile, setCaCertFile] = useState<File | null>(null);
  const connectivityMutation = useMutation(
    () =>
      axios.post('/ldap/check', {
        LDAPSettings: prepareLDAP(
          value,
          isAD ? AuthenticationMethod.AD : AuthenticationMethod.LDAP
        ),
      }),
    {
      ...withError('Connection to LDAP failed'),
      onSuccess: () =>
        notifySuccess('Success', 'Connection to LDAP successful'),
    }
  );
  const saveWithCertificateMutation = useMutation(async () => {
    if (caCertFile) {
      const form = new FormData();
      form.set('folder', 'ldap');
      form.set('file', caCertFile);
      await axios.post('/upload/tls/ca', form);
    }
    onSave();
  }, withError('Unable to upload LDAP TLS certificate'));

  return (
    <>
      <AutoUserProvisionToggle
        value={value.AutoCreateUsers}
        onChange={(AutoCreateUsers) => onChange({ AutoCreateUsers })}
        description="Automatically create authenticated directory users in Vessel HQ."
      />
      <FormSection
        title={isAD ? 'Active Directory configuration' : 'LDAP configuration'}
      >
        {!isAD && (
          <BoxSelector
            radioName="ldap-server-type"
            value={value.ServerType || SERVER_TYPES.CUSTOM}
            options={ldapOptions as BoxSelectorOption<number>[]}
            onChange={(ServerType) => onChange({ ServerType })}
            slim
          />
        )}
        <FormControl
          label={isAD ? 'AD controllers' : 'LDAP servers'}
          inputId="ldap-urls"
          tooltip="Enter one host:port per line."
        >
          <textarea
            id="ldap-urls"
            className="form-control min-h-24"
            value={(value.URLs || []).join('\n')}
            onChange={(event) =>
              onChange({ URLs: event.target.value.split(/\r?\n/) })
            }
            placeholder="ldap.example.com:389"
            data-cy="ldap-url-input"
          />
        </FormControl>
        {!isAD && (
          <SwitchField
            label="Anonymous mode"
            checked={value.AnonymousMode}
            onChange={(AnonymousMode) => onChange({ AnonymousMode })}
            labelClass="col-sm-3 col-lg-2"
            data-cy="anonymous-mode-checkbox"
          />
        )}
        {(!value.AnonymousMode || isAD) && (
          <>
            <TextField
              label={isAD ? 'Service account' : 'Reader DN'}
              id="ldap-reader-dn"
              value={value.ReaderDN}
              onChange={(ReaderDN) => onChange({ ReaderDN })}
            />
            <TextField
              label="Password"
              id="ldap-password"
              value={value.Password || ''}
              type="password"
              onChange={(Password) => onChange({ Password })}
              placeholder="Leave blank to keep the current password"
            />
          </>
        )}
        <SwitchField
          label="Use StartTLS"
          checked={value.StartTLS}
          onChange={(StartTLS) =>
            onChange({
              StartTLS,
              TLSConfig: {
                ...value.TLSConfig,
                TLS: StartTLS ? false : value.TLSConfig.TLS,
              },
            })
          }
          labelClass="col-sm-3 col-lg-2"
          data-cy="starttls-toggle"
        />
        <SwitchField
          label="Use TLS"
          checked={value.TLSConfig.TLS}
          onChange={(TLS) =>
            onChange({
              StartTLS: TLS ? false : value.StartTLS,
              TLSConfig: { ...value.TLSConfig, TLS },
            })
          }
          labelClass="col-sm-3 col-lg-2"
          data-cy="tls-toggle"
        />
        <SwitchField
          label="Skip certificate verification"
          checked={value.TLSConfig.TLSSkipVerify}
          onChange={(TLSSkipVerify) =>
            onChange({ TLSConfig: { ...value.TLSConfig, TLSSkipVerify } })
          }
          labelClass="col-sm-3 col-lg-2"
          data-cy="tls-skip-verify-toggle"
        />
        {(value.StartTLS || value.TLSConfig.TLS) &&
          !value.TLSConfig.TLSSkipVerify && (
            <FormControl label="TLS CA certificate" inputId="ldap-ca-cert">
              <Input
                id="ldap-ca-cert"
                type="file"
                onChange={(event) =>
                  setCaCertFile(event.target.files?.[0] || null)
                }
                data-cy="tls-ca-cert-upload"
              />
            </FormControl>
          )}
      </FormSection>

      <AdvancedLDAPSearchEditor
        title="User search configuration"
        value={searchYaml}
        onChange={(yaml) => {
          setSearchYaml(yaml);
          const parsed = safeParseArray<LDAPSearchSettings>(yaml);
          if (parsed) onChange({ SearchSettings: parsed });
        }}
        id="ldap-user-search"
      />
      <AdvancedLDAPSearchEditor
        title="Group search configuration"
        value={groupSearchYaml}
        onChange={(yaml) => {
          setGroupSearchYaml(yaml);
          const parsed = safeParseArray<LDAPGroupSearchSettings>(yaml);
          if (parsed) onChange({ GroupSearchSettings: parsed });
        }}
        id="ldap-group-search"
      />
      <LdapSettingsTestLogin
        settings={prepareLDAP(
          value,
          isAD ? AuthenticationMethod.AD : AuthenticationMethod.LDAP
        )}
      />
      <FormSection title="Actions">
        <div className="flex flex-wrap gap-2">
          <LoadingButton
            type="button"
            isLoading={connectivityMutation.isLoading}
            loadingText="Testing connection..."
            onClick={() => connectivityMutation.mutate()}
            data-cy="ldap-connectivity-check"
          >
            Test connection
          </LoadingButton>
          <LoadingButton
            type="button"
            isLoading={isSaving || saveWithCertificateMutation.isLoading}
            loadingText="Saving..."
            onClick={() => saveWithCertificateMutation.mutate()}
            data-cy="save-auth-settings-button"
          >
            Save settings
          </LoadingButton>
        </div>
      </FormSection>
    </>
  );
}

function OAuthForm({
  value,
  onChange,
  teams,
  isSaving,
  onSave,
}: {
  value: OAuthSettings;
  onChange(value: Partial<OAuthSettings>): void;
  teams: Array<{ Id: number; Name: string }>;
  isSaving: boolean;
  onSave(): void;
}) {
  const [mappingsYaml, setMappingsYaml] = useState(() =>
    YAML.stringify(value.TeamMemberships.OAuthClaimMappings || [])
  );
  return (
    <>
      <FormSection title="Single Sign-On">
        <SwitchField
          label="Use SSO"
          checked={value.SSO}
          onChange={(SSO) => onChange({ SSO })}
          data-cy="oauth-sso-toggle"
        />
        {value.SSO && (
          <SwitchField
            label="Hide internal authentication prompt"
            checked={!!value.HideInternalAuth}
            onChange={(HideInternalAuth) => onChange({ HideInternalAuth })}
            data-cy="oauth-hide-internal-toggle"
          />
        )}
      </FormSection>
      <AutoUserProvisionToggle
        value={value.OAuthAutoCreateUsers}
        onChange={(OAuthAutoCreateUsers) => onChange({ OAuthAutoCreateUsers })}
        description="Automatically create authenticated OAuth users in Vessel HQ."
      />
      <FormSection title="OAuth configuration">
        <TextField
          label="Client ID"
          id="oauth-client-id"
          value={value.ClientID}
          onChange={(ClientID) => onChange({ ClientID })}
        />
        <TextField
          label="Client secret"
          id="oauth-client-secret"
          type="password"
          value={value.ClientSecret || ''}
          onChange={(ClientSecret) => onChange({ ClientSecret })}
          placeholder="Leave blank to keep the current secret"
        />
        <TextField
          label="Authorization URL"
          id="oauth-authorization-uri"
          value={value.AuthorizationURI}
          onChange={(AuthorizationURI) => onChange({ AuthorizationURI })}
        />
        <TextField
          label="Access token URL"
          id="oauth-access-token-uri"
          value={value.AccessTokenURI}
          onChange={(AccessTokenURI) => onChange({ AccessTokenURI })}
        />
        <TextField
          label="Resource URL"
          id="oauth-resource-uri"
          value={value.ResourceURI}
          onChange={(ResourceURI) => onChange({ ResourceURI })}
        />
        <TextField
          label="Redirect URL"
          id="oauth-redirect-uri"
          value={value.RedirectURI}
          onChange={(RedirectURI) => onChange({ RedirectURI })}
        />
        <TextField
          label="Logout URL"
          id="oauth-logout-uri"
          value={value.LogoutURI}
          onChange={(LogoutURI) => onChange({ LogoutURI })}
        />
        <TextField
          label="User identifier"
          id="oauth-user-identifier"
          value={value.UserIdentifier}
          onChange={(UserIdentifier) => onChange({ UserIdentifier })}
        />
        <TextField
          label="Scopes"
          id="oauth-scopes"
          value={value.Scopes}
          onChange={(Scopes) => onChange({ Scopes })}
        />
        <AuthStyleField
          value={value.AuthStyle || OAuthStyle.AutoDetect}
          onChange={(AuthStyle) => onChange({ AuthStyle })}
        />
      </FormSection>
      <FormSection title="Team membership">
        <SwitchField
          label="Automatic team membership"
          checked={value.OAuthAutoMapTeamMemberships}
          onChange={(OAuthAutoMapTeamMemberships) =>
            onChange({ OAuthAutoMapTeamMemberships })
          }
          data-cy="oauth-auto-team-membership"
        />
        <FormControl label="Default team" inputId="oauth-default-team">
          <PortainerSelect
            value={value.DefaultTeamID || 0}
            options={[
              { label: 'No team', value: 0 },
              ...teams.map((team) => ({ label: team.Name, value: team.Id })),
            ]}
            onChange={(DefaultTeamID) =>
              onChange({ DefaultTeamID: DefaultTeamID || 0 })
            }
            inputId="oauth-default-team"
            data-cy="default-team-select"
          />
        </FormControl>
        {value.OAuthAutoMapTeamMemberships && (
          <>
            <TextField
              label="Claim name"
              id="oauth-claim-name"
              value={value.TeamMemberships.OAuthClaimName}
              onChange={(OAuthClaimName) =>
                onChange({
                  TeamMemberships: { ...value.TeamMemberships, OAuthClaimName },
                })
              }
            />
            <WebEditorForm
              id="oauth-team-mappings"
              type="yaml"
              value={mappingsYaml}
              onChange={(yaml) => {
                setMappingsYaml(yaml);
                const parsed = safeParseArray<{
                  ClaimValRegex: string;
                  Team: number;
                }>(yaml);
                if (parsed)
                  onChange({
                    TeamMemberships: {
                      ...value.TeamMemberships,
                      OAuthClaimMappings: parsed,
                    },
                  });
              }}
              textTip="Map OAuth claim value regular expressions to numeric Vessel HQ team IDs."
              data-cy="oauth-team-mappings"
            />
          </>
        )}
      </FormSection>
      <FormSection title="Actions">
        <LoadingButton
          type="button"
          isLoading={isSaving}
          loadingText="Saving..."
          onClick={onSave}
          data-cy="save-auth-settings-button"
        >
          Save settings
        </LoadingButton>
      </FormSection>
    </>
  );
}

function AdvancedLDAPSearchEditor({
  title,
  value,
  onChange,
  id,
}: {
  title: string;
  value: string;
  onChange(value: string): void;
  id: string;
}) {
  return (
    <FormSection title={title}>
      <WebEditorForm
        id={id}
        type="yaml"
        value={value}
        onChange={onChange}
        textTip="Advanced search entries are represented as YAML. Multiple entries provide directory fallback."
        data-cy={id}
      />
    </FormSection>
  );
}

function TextField({
  label,
  id,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange(value: string): void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <FormControl label={label} inputId={id}>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'new-password' : undefined}
        data-cy={id}
      />
    </FormControl>
  );
}

function normalizeLDAP(value: LDAPSettings): LDAPSettings {
  return {
    ...value,
    URLs: value.URLs?.length ? value.URLs : [value.URL || ''],
    ServerType: value.ServerType ?? SERVER_TYPES.CUSTOM,
    SearchSettings: value.SearchSettings || [],
    GroupSearchSettings: value.GroupSearchSettings || [],
    TLSConfig: value.TLSConfig || { TLS: false, TLSSkipVerify: false },
  };
}

function prepareLDAP(value: LDAPSettings, authMethod: number): LDAPSettings {
  const URLs = (value.URLs || [])
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) =>
      url.includes(':') ? url : `${url}${value.TLSConfig.TLS ? ':636' : ':389'}`
    );
  const AnonymousMode =
    authMethod === AuthenticationMethod.AD ? false : value.AnonymousMode;
  return {
    ...value,
    ServerType:
      authMethod === AuthenticationMethod.AD
        ? SERVER_TYPES.AD
        : value.ServerType,
    AnonymousMode,
    ReaderDN: AnonymousMode ? '' : value.ReaderDN,
    Password: AnonymousMode ? '' : value.Password,
    URLs,
    URL: URLs[0] || '',
  };
}

function normalizeOAuth(value: OAuthSettings): OAuthSettings {
  return {
    ...value,
    RedirectURI: value.RedirectURI || `${window.location.origin}/`,
    TeamMemberships: value.TeamMemberships || {
      OAuthClaimName: '',
      OAuthClaimMappings: [],
    },
  };
}

function safeParseArray<T>(value: string): T[] | undefined {
  try {
    const parsed = YAML.parse(value);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}
