package webhookgateway

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type deliveryEvent struct {
	Route      string `json:"route"`
	Delivery   string `json:"delivery"`
	BodyDigest string `json:"bodyDigest,omitempty"`
	Succeeded  int    `json:"succeeded,omitempty"`
	Failed     int    `json:"failed,omitempty"`
}

// PersistentAudit uses retained activity records as a durable deduplication
// ledger, including across process restart and an HA takeover. Seven-day audit
// retention exceeds the five-minute signature window. No payload or credential
// is stored. Acceptance is at-most-once, not a guaranteed-delivery queue.
func PersistentAudit(store dataservices.DataStore) (Reserve, Complete) {
	write := func(tx dataservices.DataStoreTx, ctx context.Context, action string, event deliveryEvent) error {
		if err := ctx.Err(); err != nil {
			return err
		}
		data, err := json.Marshal(event)
		if err != nil {
			return err
		}
		return tx.ActivityLog().Create(&portainer.ActivityLog{Timestamp: time.Now().Unix(), Username: "webhook-gateway", Action: action, Context: "webhook-gateway", Payload: base64.StdEncoding.EncodeToString(data)})
	}
	reserve := func(ctx context.Context, route, delivery, digest string) error {
		if err := ctx.Err(); err != nil {
			return err
		}
		return store.UpdateTx(func(tx dataservices.DataStoreTx) error {
			entries, err := tx.ActivityLog().ReadAll(func(entry portainer.ActivityLog) bool {
				return entry.Action == "webhook.gateway.accepted" && entry.Context == "webhook-gateway"
			})
			if err != nil {
				return err
			}
			for _, entry := range entries {
				var event deliveryEvent
				data, err := base64.StdEncoding.DecodeString(entry.Payload)
				if err != nil {
					return err
				}
				if err := json.Unmarshal(data, &event); err != nil {
					return err
				}
				if event.Route == route && event.Delivery == delivery {
					return ErrDuplicate
				}
			}
			return write(tx, ctx, "webhook.gateway.accepted", deliveryEvent{Route: route, Delivery: delivery, BodyDigest: digest})
		})
	}
	complete := func(ctx context.Context, route, delivery string, succeeded, failed int) error {
		return store.UpdateTx(func(tx dataservices.DataStoreTx) error {
			return write(tx, ctx, "webhook.gateway.completed", deliveryEvent{Route: route, Delivery: delivery, Succeeded: succeeded, Failed: failed})
		})
	}
	return reserve, complete
}
