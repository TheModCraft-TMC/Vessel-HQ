import { FormEvent } from 'react';

import { LoadingButton, Button } from '@@/buttons';
import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { Input } from '@@/form-components/Input';
import { SwitchField } from '@@/form-components/SwitchField';

import { Registry, RegistryTypes } from './types/registry';
import { registryLabelMap } from './utils/constants';

export type RegistryFormValues = {
  Type: RegistryTypes;
  Name: string;
  URL: string;
  BaseURL: string;
  Authentication: boolean;
  Username: string;
  Password: string;
  Ecr: { Region: string };
  Quay: { UseOrganisation: boolean; OrganisationName: string };
  Github: { UseOrganisation: boolean; OrganisationName: string };
  Gitlab: { ProjectId: number; InstanceURL: string; ProjectPath: string };
};

export function RegistryForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  isLoading,
  existingNames,
  isEdit = false,
}: {
  values: RegistryFormValues;
  onChange(values: RegistryFormValues): void;
  onSubmit(): void;
  onCancel(): void;
  isLoading: boolean;
  existingNames: string[];
  isEdit?: boolean;
}) {
  const fixedUrl = [
    RegistryTypes.DOCKERHUB,
    RegistryTypes.QUAY,
    RegistryTypes.GITHUB,
  ].includes(values.Type);
  const needsAuthentication = values.Authentication;
  const isNameUsed = existingNames.includes(values.Name);
  const isValid =
    Boolean(values.Name && values.URL) &&
    !isNameUsed &&
    (values.Type !== RegistryTypes.PROGET || Boolean(values.BaseURL)) &&
    (!needsAuthentication ||
      Boolean(values.Username && (isEdit || values.Password))) &&
    (values.Type !== RegistryTypes.ECR ||
      !needsAuthentication ||
      Boolean(values.Ecr.Region)) &&
    (values.Type !== RegistryTypes.QUAY ||
      !values.Quay.UseOrganisation ||
      Boolean(values.Quay.OrganisationName)) &&
    (values.Type !== RegistryTypes.GITHUB ||
      !values.Github.UseOrganisation ||
      Boolean(values.Github.OrganisationName)) &&
    (values.Type !== RegistryTypes.GITLAB ||
      Boolean(
        values.Gitlab.InstanceURL &&
        values.Gitlab.ProjectPath &&
        values.Gitlab.ProjectId
      ));

  return (
    <form
      className="form-horizontal"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        if (isValid) onSubmit();
      }}
    >
      <FormSection title="Registry details">
        <FormControl label="Provider" inputId="registry-provider">
          <Input
            id="registry-provider"
            value={registryLabelMap[values.Type]}
            disabled
            data-cy="registries-provider-input"
          />
        </FormControl>
        <FormControl
          label="Name"
          inputId="registry-name"
          required
          errors={
            isNameUsed
              ? 'A registry with the same name already exists.'
              : undefined
          }
        >
          <Input
            id="registry-name"
            value={values.Name}
            onChange={(event) => set('Name', event.target.value)}
            placeholder="e.g. production-registry"
            data-cy="registry-name-input"
          />
        </FormControl>
        <FormControl label="Registry URL" inputId="registry-url" required>
          <Input
            id="registry-url"
            value={values.URL}
            onChange={(event) => set('URL', event.target.value)}
            placeholder="e.g. registry.example.com"
            disabled={fixedUrl}
            data-cy="registry-url-input"
          />
        </FormControl>
        {values.Type === RegistryTypes.PROGET && (
          <FormControl label="Base URL" inputId="registry-base-url" required>
            <Input
              id="registry-base-url"
              value={values.BaseURL}
              onChange={(event) => set('BaseURL', event.target.value)}
              placeholder="e.g. proget.example.com"
              data-cy="registry-base-url-input"
            />
          </FormControl>
        )}
      </FormSection>

      {values.Type === RegistryTypes.GITLAB && (
        <FormSection title="GitLab project">
          <FormControl label="Instance URL" inputId="gitlab-instance" required>
            <Input
              id="gitlab-instance"
              value={values.Gitlab.InstanceURL}
              onChange={(event) =>
                setNested('Gitlab', 'InstanceURL', event.target.value)
              }
              placeholder="https://gitlab.com"
              data-cy="gitlab-instance-url-input"
            />
          </FormControl>
          <FormControl label="Project ID" inputId="gitlab-project-id" required>
            <Input
              id="gitlab-project-id"
              type="number"
              min={1}
              value={values.Gitlab.ProjectId || ''}
              onChange={(event) =>
                setNested('Gitlab', 'ProjectId', Number(event.target.value))
              }
              data-cy="gitlab-project-id-input"
            />
          </FormControl>
          <FormControl
            label="Project path"
            inputId="gitlab-project-path"
            required
          >
            <Input
              id="gitlab-project-path"
              value={values.Gitlab.ProjectPath}
              onChange={(event) =>
                setNested('Gitlab', 'ProjectPath', event.target.value)
              }
              placeholder="group/project"
              data-cy="gitlab-project-path-input"
            />
          </FormControl>
        </FormSection>
      )}

      <FormSection title="Authentication">
        <SwitchField
          label="Authentication"
          checked={values.Authentication}
          onChange={(value) => set('Authentication', value)}
          disabled={
            values.Type !== RegistryTypes.CUSTOM &&
            values.Type !== RegistryTypes.ECR
          }
          tooltip="Enable credentials for private registry access."
          data-cy="registry-authentication-switch"
        />
        {needsAuthentication && (
          <>
            <FormControl
              label={
                values.Type === RegistryTypes.ECR
                  ? 'AWS Access Key'
                  : 'Username'
              }
              inputId="registry-username"
              required
            >
              <Input
                id="registry-username"
                value={values.Username}
                onChange={(event) => set('Username', event.target.value)}
                data-cy="registry-username-input"
              />
            </FormControl>
            <FormControl
              label={passwordLabel(values.Type)}
              inputId="registry-password"
              required={!isEdit}
            >
              <Input
                id="registry-password"
                type="password"
                value={values.Password}
                onChange={(event) => set('Password', event.target.value)}
                placeholder={
                  isEdit ? 'Leave blank to keep current credential' : undefined
                }
                autoComplete="new-password"
                data-cy="registry-password-input"
              />
            </FormControl>
          </>
        )}
        {values.Type === RegistryTypes.ECR && needsAuthentication && (
          <FormControl label="Region" inputId="registry-region" required>
            <Input
              id="registry-region"
              value={values.Ecr.Region}
              onChange={(event) =>
                setNested('Ecr', 'Region', event.target.value)
              }
              placeholder="us-west-1"
              data-cy="registry-region-input"
            />
          </FormControl>
        )}
        {values.Type === RegistryTypes.QUAY && (
          <OrganisationFields
            provider="Quay"
            value={values.Quay}
            onChange={(value) => onChange({ ...values, Quay: value })}
          />
        )}
        {values.Type === RegistryTypes.GITHUB && (
          <OrganisationFields
            provider="GitHub"
            value={values.Github}
            onChange={(value) => onChange({ ...values, Github: value })}
          />
        )}
      </FormSection>

      <FormSection title="Actions">
        <div className="flex gap-2">
          <LoadingButton
            isLoading={isLoading}
            loadingText={
              isEdit ? 'Updating registry...' : 'Creating registry...'
            }
            disabled={!isValid || isLoading}
            className="!ml-0"
            data-cy="registry-submit-button"
          >
            {isEdit ? 'Update registry' : 'Create registry'}
          </LoadingButton>
          <Button
            color="default"
            onClick={onCancel}
            data-cy="registry-cancel-button"
          >
            Cancel
          </Button>
        </div>
      </FormSection>
    </form>
  );

  function set<K extends keyof RegistryFormValues>(
    key: K,
    value: RegistryFormValues[K]
  ) {
    onChange({ ...values, [key]: value });
  }

  function setNested<
    K extends 'Ecr' | 'Gitlab',
    P extends keyof RegistryFormValues[K],
  >(key: K, property: P, value: RegistryFormValues[K][P]) {
    onChange({
      ...values,
      [key]: { ...values[key], [property]: value },
    });
  }
}

function OrganisationFields({
  provider,
  value,
  onChange,
}: {
  provider: string;
  value: { UseOrganisation: boolean; OrganisationName: string };
  onChange(value: { UseOrganisation: boolean; OrganisationName: string }): void;
}) {
  return (
    <>
      <SwitchField
        label="Use organization registry"
        checked={value.UseOrganisation}
        onChange={(UseOrganisation) => onChange({ ...value, UseOrganisation })}
        data-cy={`${provider.toLowerCase()}-organization-switch`}
      />
      {value.UseOrganisation && (
        <FormControl
          label="Organization name"
          inputId={`${provider.toLowerCase()}-organization-name`}
          required
        >
          <Input
            id={`${provider.toLowerCase()}-organization-name`}
            value={value.OrganisationName}
            onChange={(event) =>
              onChange({ ...value, OrganisationName: event.target.value })
            }
            data-cy={`${provider.toLowerCase()}-organization-input`}
          />
        </FormControl>
      )}
    </>
  );
}

export function defaultsForType(type: RegistryTypes): RegistryFormValues {
  const values: RegistryFormValues = {
    Type: type,
    Name: '',
    URL: '',
    BaseURL: '',
    Authentication: type !== RegistryTypes.CUSTOM && type !== RegistryTypes.ECR,
    Username: '',
    Password: '',
    Ecr: { Region: '' },
    Quay: { UseOrganisation: false, OrganisationName: '' },
    Github: { UseOrganisation: false, OrganisationName: '' },
    Gitlab: {
      ProjectId: 0,
      InstanceURL: 'https://gitlab.com',
      ProjectPath: '',
    },
  };

  if (type === RegistryTypes.DOCKERHUB) values.URL = 'docker.io';
  if (type === RegistryTypes.QUAY) {
    values.Name = 'Quay';
    values.URL = 'quay.io';
  }
  if (type === RegistryTypes.GITHUB) {
    values.Name = 'GitHub Container Registry';
    values.URL = 'ghcr.io';
  }
  if (type === RegistryTypes.GITLAB) values.URL = 'https://registry.gitlab.com';
  return values;
}

export function valuesFromRegistry(registry: Registry): RegistryFormValues {
  return {
    Type: registry.Type,
    Name: registry.Name,
    URL: registry.URL,
    BaseURL: registry.BaseURL || '',
    Authentication: registry.Authentication,
    Username: registry.Username || '',
    Password: '',
    Ecr: registry.Ecr || { Region: '' },
    Quay: {
      UseOrganisation: registry.Quay?.UseOrganisation || false,
      OrganisationName: registry.Quay?.OrganisationName || '',
    },
    Github: registry.Github || {
      UseOrganisation: false,
      OrganisationName: '',
    },
    Gitlab: registry.Gitlab || {
      ProjectId: 0,
      InstanceURL: 'https://gitlab.com',
      ProjectPath: '',
    },
  };
}

function passwordLabel(type: RegistryTypes) {
  if (type === RegistryTypes.ECR) return 'AWS Secret Access Key';
  if (type === RegistryTypes.DOCKERHUB) return 'Access token';
  if (type === RegistryTypes.GITLAB || type === RegistryTypes.GITHUB) {
    return 'Personal Access Token';
  }
  return 'Password';
}
