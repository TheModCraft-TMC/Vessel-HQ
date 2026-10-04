import { Environment } from '@/domains/environments';
import { Registry } from '@/domains/registries';

enum WebhookType {
  Service = 1,
  Container = 2,
}

export interface Webhook {
  Id: string;
  Token: string;
  ResourceId: string;
  EndpointId: Environment['Id'];
  RegistryId: Registry['Id'];
  Type: WebhookType;
}
