/**
 * KubernetesResourceReservation Model
 */
const _KubernetesResourceReservation = Object.freeze({
  Memory: 0,
  CPU: 0,
});

export class KubernetesResourceReservation {
  Memory = 0;
  CPU = 0;

  constructor() {
    Object.assign(
      this,
      JSON.parse(JSON.stringify(_KubernetesResourceReservation))
    );
  }
}
