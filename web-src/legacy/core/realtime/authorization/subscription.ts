export type RealtimeAuthorization = {
  canSubscribe: (subscription: RealtimeSubscription) => boolean;
};

export type RealtimeSubscription = {
  key: string;
  resource: string;
  environmentId?: number;
};

export const allowAllRealtimeSubscriptions: RealtimeAuthorization = {
  canSubscribe: () => true,
};
