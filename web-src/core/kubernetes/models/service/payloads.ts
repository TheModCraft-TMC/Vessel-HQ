import { KubernetesCommonMetadataPayload } from '@/core/kubernetes/models/common/payloads';

export class KubernetesServiceCreatePayload {
  metadata = new KubernetesCommonMetadataPayload();

  spec = {
    ports: [] as Array<Record<string, unknown>>,
    selector: {
      app: '',
    },
    type: '',
    clusterIP: '',
  };
}
