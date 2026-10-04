import {
  allowAllRealtimeSubscriptions,
  RealtimeAuthorization,
  RealtimeSubscription,
} from '@/core/realtime/authorization/subscription';

export type SubscriptionHandler = (subscription: RealtimeSubscription) => void;

export class RealtimeSubscriptionRegistry {
  private readonly subscriptions = new Map<string, RealtimeSubscription>();

  constructor(
    private readonly authorization: RealtimeAuthorization = allowAllRealtimeSubscriptions
  ) {}

  subscribe(
    subscription: RealtimeSubscription,
    onSubscribe?: SubscriptionHandler
  ) {
    if (!this.authorization.canSubscribe(subscription)) {
      throw new Error(
        `Realtime subscription is not authorized: ${subscription.key}`
      );
    }
    this.subscriptions.set(subscription.key, subscription);
    onSubscribe?.(subscription);
    return () => this.subscriptions.delete(subscription.key);
  }

  snapshot() {
    return [...this.subscriptions.values()];
  }
}
