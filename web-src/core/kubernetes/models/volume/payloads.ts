import { KubernetesCommonMetadataPayload } from '@/core/kubernetes/models/common/payloads';

export class KubernetesPersistentVolumClaimCreatePayload {
  metadata = new KubernetesCommonMetadataPayload();

  spec = {
    accessModes: ['ReadWriteOnce'],
    resources: {
      requests: {
        storage: '',
      },
    },
    storageClassName: '',
  };
}
