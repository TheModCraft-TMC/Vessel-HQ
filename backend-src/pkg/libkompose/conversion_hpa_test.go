package libkompose

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
	autoscalingv2 "k8s.io/api/autoscaling/v2"
	"k8s.io/apimachinery/pkg/runtime"
)

func TestComposeConversionUsesStableHPA(t *testing.T) {
	// Kompose's converter uses process-level options, so keep this integration
	// test serial even though its files are isolated.
	dir := t.TempDir()
	compose := filepath.Join(dir, "compose.yaml")
	require.NoError(t, os.WriteFile(compose, []byte(`services:
  web:
    image: nginx:stable
    labels:
      kompose.hpa.replicas.min: "2"
      kompose.hpa.replicas.max: "5"
      kompose.hpa.cpu: "60"
      kompose.hpa.memory: "75"
`), 0600))
	objects, err := ConvertComposeFiles([]string{compose}, &ConvertOptions{
		OutFile: filepath.Join(dir, "converted.yaml"),
	})
	require.NoError(t, err)
	scheme := runtime.NewScheme()
	require.NoError(t, autoscalingv2.AddToScheme(scheme))
	for _, object := range objects {
		if object.GetObjectKind().GroupVersionKind().Kind != "HorizontalPodAutoscaler" {
			continue
		}
		hpa, ok := object.(*autoscalingv2.HorizontalPodAutoscaler)
		require.True(t, ok, "conversion must use stable Go types, got %T", object)
		kinds, _, err := scheme.ObjectKinds(hpa)
		require.NoError(t, err)
		require.Len(t, kinds, 1)
		require.Equal(t, autoscalingv2.SchemeGroupVersion, kinds[0].GroupVersion())
		require.EqualValues(t, 2, *hpa.Spec.MinReplicas)
		require.EqualValues(t, 5, hpa.Spec.MaxReplicas)
		require.Equal(t, "apps/v1", hpa.Spec.ScaleTargetRef.APIVersion)
		require.Len(t, hpa.Spec.Metrics, 2)
		require.EqualValues(t, 60, *hpa.Spec.Metrics[0].Resource.Target.AverageUtilization)
		require.EqualValues(t, 75, *hpa.Spec.Metrics[1].Resource.Target.AverageUtilization)
		return
	}
	t.Fatal("Compose conversion did not produce an HPA")
}
