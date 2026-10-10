'use client';

import {
  KubernetesShellStatus,
  KubectlTerminal,
  useKubernetesShell,
} from '@app/_components/platform/kubernetes/KubernetesShellPage';

export default function Page() {
  const shell = useKubernetesShell();

  return (
    <div className="fixed bottom-0 left-0 right-0 top-0 z-[10000] bg-black text-white">
      <KubernetesShellStatus state={shell.shellState} />
      <KubectlTerminal
        environmentId={shell.environmentId}
        supportsResize={shell.supportsResize}
        onStateChange={shell.onStateChange}
      />
    </div>
  );
}
