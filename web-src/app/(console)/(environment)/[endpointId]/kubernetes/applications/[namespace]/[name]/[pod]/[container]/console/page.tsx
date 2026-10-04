'use client';

import { ApplicationPageHeader } from '@console/console/platform/kubernetes/KubernetesApplicationPages';

import { ApplicationConsoleContent } from '@/domains/applications/applications/ConsoleView/ConsoleView';

export default function Page() {
  return (
    <>
      <ApplicationPageHeader title="Application console" suffix="Console" />
      <ApplicationConsoleContent />
    </>
  );
}
