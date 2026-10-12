import { replace, set, truncate, unset } from 'lodash';

class KubernetesCommonHelper {
  static assignOrDeleteIfEmpty(obj: object, path: string, value: unknown) {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      unset(obj, path);
    } else {
      set(obj, path, value);
    }
  }

  static ownerToLabel(owner: string) {
    let label = replace(owner, /[^-A-Za-z0-9_.]/g, '.');
    label = truncate(label, { length: 63, omission: '' });
    label = replace(label, /^[-_.]*/g, '');
    label = replace(label, /[-_.]*$/g, '');
    return label;
  }

  static assignOrDeleteIfEmptyOrZero(
    obj: object,
    path: string,
    value: unknown
  ) {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      unset(obj, path);
    } else {
      set(obj, path, value);
    }
  }
}

export default KubernetesCommonHelper;
