import { KubernetesPortainerResourceQuotaPrefix } from '@/core/kubernetes/models/resource-quota/models';

class KubernetesResourceQuotaHelper {
  static generateResourceQuotaName(name: string) {
    return KubernetesPortainerResourceQuotaPrefix + name;
  }

  static formatBytes(bytes: number, decimals = 0, base10 = true) {
    if (bytes === 0) {
      return { size: 0, sizeUnit: 'B' };
    }

    const unit = base10 ? 1000 : 1024;
    const precision = Math.max(decimals, 0);
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const index = Math.floor(Math.log(bytes) / Math.log(unit));

    return {
      size: Number.parseFloat((bytes / unit ** index).toFixed(precision)),
      sizeUnit: sizes[index],
    };
  }
}

export default KubernetesResourceQuotaHelper;
