package nativeextensions

// ImageAutomation is an opt-in host job, bound to one approved extension and stack.
// ConfiguredBy is revalidated as an administrator before every run.
type ImageAutomation struct {
	Version         int    `json:"version"`
	Enabled         bool   `json:"enabled"`
	Mode            string `json:"mode"`
	IntervalMinutes int    `json:"intervalMinutes"`
	EnvironmentID   int    `json:"environmentId"`
	StackID         int    `json:"stackId"`
	ConfiguredBy    int    `json:"configuredBy"`
	LastCheck       int64  `json:"lastCheck"`
	LastOutcome     string `json:"lastOutcome"`
}

func (p ImageAutomation) Valid() bool {
	return (p.Mode == "monitor-only" || p.Mode == "automatic") && p.IntervalMinutes >= 5 && p.IntervalMinutes <= 1440 && p.EnvironmentID > 0 && p.StackID > 0
}
