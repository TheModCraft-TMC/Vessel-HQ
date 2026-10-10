import { RegistryFormValues } from '@/domains/registries/components/RegistryForm';
import { RegistryPayload } from '@/domains/registries/services/registry.service';

export function toRegistryPayload(values: RegistryFormValues): RegistryPayload {
  return {
    Type: values.Type,
    Name: values.Name,
    URL: stripProtocolAndSlash(values.URL),
    BaseURL: stripProtocolAndSlash(values.BaseURL),
    Authentication: values.Authentication,
    Username: values.Authentication ? values.Username : '',
    Password: values.Authentication ? values.Password : '',
    TLS: !/^http:\/\//i.test(values.URL),
    Gitlab: values.Gitlab,
    Quay: values.Quay,
    Github: values.Github,
    Ecr: values.Ecr,
  };
}

function stripProtocolAndSlash(value: string) {
  return value.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}
