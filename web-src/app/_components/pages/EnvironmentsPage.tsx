'use client';

import { useCallback } from 'react';
import { useStore } from 'zustand';

import type { Environment } from '@/domains/environments';
import { EnvironmentHomeView } from '@/domains/environments/views/EnvironmentHomeView';
import { environmentStore } from '@/react/hooks/current-environment-store';

export function EnvironmentsContent() {
  const selectEnvironment = useStore(
    environmentStore,
    (state) => state.selectEnvironment
  );
  const handleBrowse = useCallback(
    (environment: Environment) => selectEnvironment(environment),
    [selectEnvironment]
  );

  return <EnvironmentHomeView onClickBrowse={handleBrowse} />;
}
