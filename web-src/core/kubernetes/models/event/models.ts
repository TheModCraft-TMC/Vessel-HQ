/**
 * KubernetesEvent Model
 */
const _KubernetesEvent = Object.freeze({
  Id: '',
  Date: 0,
  Type: '',
  Message: '',
  Involved: {},
});

export class KubernetesEvent {
  Id = '';
  Date: number | string = 0;
  Type = '';
  Message = '';
  Involved: Record<string, unknown> = {};

  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesEvent)));
  }
}
