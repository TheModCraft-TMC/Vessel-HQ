import { KubernetesEventDto } from '../dto/event';

export function mapKubernetesEvent(dto: KubernetesEventDto) {
  return {
    type: dto.type ?? '',
    name: dto.name ?? '',
    reason: dto.reason ?? '',
    message: dto.message ?? '',
    namespace: dto.namespace ?? '',
    eventTime: toDate(dto.eventTime),
    kind: dto.kind,
    count: dto.count ?? 0,
    lastTimestamp: toOptionalDate(dto.lastTimestamp),
    firstTimestamp: toOptionalDate(dto.firstTimestamp),
    uid: dto.uid ?? '',
    involvedObject: {
      uid: dto.involvedObject?.uid ?? '',
      kind: dto.involvedObject?.kind,
      name: dto.involvedObject?.name ?? '',
      namespace: dto.involvedObject?.namespace ?? '',
    },
  };
}

function toDate(value?: string) {
  return value ? new Date(value) : new Date(0);
}

function toOptionalDate(value?: string) {
  return value ? new Date(value) : undefined;
}
