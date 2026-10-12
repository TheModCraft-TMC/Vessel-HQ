export class KubernetesCommonMetadataPayload {
  uid = '';

  name = '';

  namespace = '';

  labels: Record<string, string> = {};

  annotations: Record<string, string> = {};
}
