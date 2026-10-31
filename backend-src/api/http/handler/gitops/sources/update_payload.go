package sources

// SourceUpdatePayload describes the partial update accepted by both the update
// and stored-source connection-test endpoints. The stored source type selects
// the applicable fields: Git uses URL, interval and username/password; Vault
// uses addresses, namespace, KV version and method/token. Omitted values retain
// their stored values; an empty Git authentication object clears Git credentials.
type SourceUpdatePayload struct {
	Name            *string                            `json:"name"`
	URL             *string                            `json:"url"`
	Interval        *string                            `json:"interval"`
	Address         *string                            `json:"address"`
	InternalAddress *string                            `json:"internalAddress"`
	Namespace       *string                            `json:"namespace"`
	KVVersion       *int                               `json:"kvVersion"`
	TLSSkipVerify   *bool                              `json:"tlsSkipVerify"`
	Authentication  *SourceAuthenticationUpdatePayload `json:"authentication"`
}

// SourceAuthenticationUpdatePayload contains the credentials for the stored
// source type. Git accepts username/password; Vault accepts method/token.
type SourceAuthenticationUpdatePayload struct {
	Username *string `json:"username"`
	Password *string `json:"password"`
	Method   *string `json:"method"`
	Token    *string `json:"token"`
}
