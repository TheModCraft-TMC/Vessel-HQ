package topology

type Network struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Driver   string `json:"driver"`
	Scope    string `json:"scope"`
	Internal bool   `json:"internal"`
}
type Attachment struct {
	NetworkID string `json:"networkId"`
}
type Workload struct {
	ID       string       `json:"id"`
	Name     string       `json:"name"`
	Kind     string       `json:"kind"`
	State    string       `json:"state,omitempty"`
	Networks []Attachment `json:"networks"`
}
type Graph struct {
	Traffic       *TrafficSnapshot `json:"traffic,omitempty"`
	EnvironmentID int              `json:"environmentId"`
	StackID       int              `json:"stackId"`
	Name          string           `json:"name"`
	Networks      []Network        `json:"networks"`
	Workloads     []Workload       `json:"workloads"`
}
