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
    let start = 0;
    let end = label.length;
    function isBoundaryPunctuation(char: string) {
      return '-_.'.includes(char);
    }
    while (start < end && isBoundaryPunctuation(label[start])) start += 1;
    while (end > start && isBoundaryPunctuation(label[end - 1])) end -= 1;
    return label.slice(start, end);
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
