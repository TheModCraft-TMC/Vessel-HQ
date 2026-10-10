'use client';

import { ApplicationPageHeader } from '@app/_components/platform/kubernetes/KubernetesApplicationPages';
import { ApplicationConsoleContent } from '@app/_components/platform/kubernetes/applications/ConsoleView/ConsoleView';

export default function Page() {
  return (
    <>
      <ApplicationPageHeader title="Application console" suffix="Console" />
      <ApplicationConsoleContent />
    </>
  );
}
