export interface KubernetesEventDto {
  type?: string;
  name?: string;
  reason?: string;
  message?: string;
  namespace?: string;
  eventTime?: string;
  kind?: string;
  count?: number;
  lastTimestamp?: string;
  firstTimestamp?: string;
  uid?: string;
  involvedObject?: {
    uid?: string;
    kind?: string;
    name?: string;
    namespace?: string;
  };
}
